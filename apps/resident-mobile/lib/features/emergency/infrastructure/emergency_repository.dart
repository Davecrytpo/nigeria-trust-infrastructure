import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:resident_mobile/core/infrastructure/offline_sync_service.dart';

class EmergencyRepository {
  EmergencyRepository({
    required this.baseUrl,
    required this.offlineSync,
    http.Client? httpClient,
  }) : _httpClient = httpClient ?? http.Client();

  final String baseUrl;
  final OfflineSyncService offlineSync;
  final http.Client _httpClient;

  Future<void> triggerEmergency(Map<String, dynamic> data) async {
    final queuedIncident = _normalizeIncident(data);

    // Persist before network I/O so Android process death does not lose the SOS.
    await offlineSync.queueIncident(queuedIncident);

    try {
      await _uploadIncident(queuedIncident);
    } catch (error) {
      await offlineSync.markFailed(queuedIncident['clientMutationId'] as String, error);
      _triggerSmsFallback(queuedIncident);
      rethrow;
    }
  }

  Future<int> syncPendingIncidents({int limit = 25}) async {
    await offlineSync.recoverInterruptedUploads();
    final pending = await offlineSync.getPendingIncidents(limit: limit);
    if (pending.isEmpty) return 0;

    final ids = pending.map((item) => item['clientMutationId'] as String).toList();
    await offlineSync.markSyncing(ids);

    try {
      final response = await _httpClient
          .post(
            Uri.parse('$baseUrl/api/mobile/sync'),
            body: jsonEncode({'incidents': pending}),
            headers: {'Content-Type': 'application/json'},
          )
          .timeout(const Duration(seconds: 15));

      if (response.statusCode != 202) {
        throw Exception('Mobile sync failed with status ${response.statusCode}');
      }

      final body = jsonDecode(response.body) as Map<String, dynamic>;
      final results = (body['results'] as List<dynamic>? ?? const []);
      for (final result in results) {
        final entry = result as Map<String, dynamic>;
        await offlineSync.markSynced(
          entry['clientMutationId'] as String,
          entry['incidentId'] as String,
        );
      }
      return results.length;
    } catch (error) {
      for (final id in ids) {
        await offlineSync.markFailed(id, error);
      }
      rethrow;
    }
  }

  Future<void> _uploadIncident(Map<String, dynamic> incident) async {
    final response = await _httpClient
        .post(
          Uri.parse('$baseUrl/api/incidents'),
          body: jsonEncode(incident),
          headers: {'Content-Type': 'application/json'},
        )
        .timeout(const Duration(seconds: 5));

    if (response.statusCode != 201) {
      throw Exception('Incident upload failed with status ${response.statusCode}');
    }

    final body = jsonDecode(response.body) as Map<String, dynamic>;
    final serverIncident = body['incident'] as Map<String, dynamic>;
    await offlineSync.markSynced(
      incident['clientMutationId'] as String,
      serverIncident['id'] as String,
    );
  }

  Map<String, dynamic> _normalizeIncident(Map<String, dynamic> data) {
    final now = DateTime.now().toUtc();
    final clientMutationId = (data['clientMutationId'] ??
            data['id'] ??
            'mobile-${now.microsecondsSinceEpoch}')
        .toString();

    return {
      ...data,
      'clientMutationId': clientMutationId,
      'requesterName': data['requesterName'] ?? 'Resident mobile device',
      'incidentType': data['incidentType'] ?? data['type'],
      'severity': data['severity'] ?? 'high',
      'locationNote': data['locationNote'] ?? data['landmarks'] ?? 'Mobile emergency alert.',
      'sharePreciseLocation': data['sharePreciseLocation'] ?? true,
      'createdAt': data['createdAt'] ?? now.toIso8601String(),
    };
  }

  void _triggerSmsFallback(Map<String, dynamic> data) {
    // Device SMS sending is wired at the platform integration layer; this method
    // is intentionally side-effect free for repository tests.
  }
}
