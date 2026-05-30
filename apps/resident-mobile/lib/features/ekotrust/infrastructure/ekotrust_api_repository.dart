import 'dart:convert';

import 'package:ekotrust_mobile/core/infrastructure/api_config.dart';
import 'package:ekotrust_mobile/features/ekotrust/domain/ekotrust_models.dart';
import 'package:http/http.dart' as http;

class EkoTrustApiRepository {
  EkoTrustApiRepository({
    http.Client? client,
    String? baseUrl,
  })  : _client = client ?? http.Client(),
        _baseUrl = ApiConfig.normalizeBaseUrl(
          baseUrl ?? ApiConfig.defaultBaseUrl,
        );

  final http.Client _client;
  final String _baseUrl;

  Future<List<EkoTrustProfile>> listProfiles() async {
    final response = await _get('/trust/profiles');
    final items = jsonDecode(response.body) as List<dynamic>;
    return items
        .map((item) => EkoTrustProfile.fromJson(item as Map<String, dynamic>))
        .toList(growable: false);
  }

  Future<EkoTrustProfile> getProfile(String artisanId) async {
    final response = await _get('/trust/profiles/$artisanId');
    return EkoTrustProfile.fromJson(
      jsonDecode(response.body) as Map<String, dynamic>,
    );
  }

  Future<List<EkoTrustWorkProof>> listWorkProofs(String artisanId) async {
    final response = await _get('/trust/profiles/$artisanId/proofs');
    final items = jsonDecode(response.body) as List<dynamic>;
    return items
        .map((item) => EkoTrustWorkProof.fromJson(item as Map<String, dynamic>))
        .toList(growable: false);
  }

  Future<EkoTrustWorkProof> createWorkProof({
    required String artisanId,
    required String title,
    required String category,
    required String location,
    required int beforeMediaCount,
    required int afterMediaCount,
  }) async {
    final response = await _post('/trust/proofs', {
      'artisanId': artisanId,
      'title': title,
      'category': category,
      'location': location,
      'beforeMediaCount': beforeMediaCount,
      'afterMediaCount': afterMediaCount,
    });
    return EkoTrustWorkProof.fromJson(
      jsonDecode(response.body) as Map<String, dynamic>,
    );
  }

  Future<Map<String, dynamic>> sendOtp(String phoneNumber) async {
    final response = await _post('/trust/otp/send', {
      'phoneNumber': phoneNumber,
    });
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> verifyOtp({
    required String sessionToken,
    required String code,
  }) async {
    final response = await _post('/trust/otp/verify', {
      'sessionToken': sessionToken,
      'code': code,
    });
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> createMediaUploadIntent({
    required String proofId,
    required String mediaRole,
    required String mediaType,
    required String fileName,
    required String contentType,
    required int byteSize,
    required String contentHash,
  }) async {
    final response = await _post('/trust/media/upload-intents', {
      'proofId': proofId,
      'mediaRole': mediaRole,
      'mediaType': mediaType,
      'fileName': fileName,
      'contentType': contentType,
      'byteSize': byteSize,
      'contentHash': contentHash,
    });
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> registerWorkProofMedia({
    required String proofId,
    required String mediaRole,
    required String mediaType,
    required String storageKey,
    required String contentHash,
    required int byteSize,
    int? width,
    int? height,
    int? durationMs,
  }) async {
    final response = await _post('/trust/media', {
      'proofId': proofId,
      'mediaRole': mediaRole,
      'mediaType': mediaType,
      'storageKey': storageKey,
      'contentHash': contentHash,
      'byteSize': byteSize,
      if (width != null) 'width': width,
      if (height != null) 'height': height,
      if (durationMs != null) 'durationMs': durationMs,
    });
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  Future<http.Response> _get(String path) {
    return _send(() => _client.get(Uri.parse('$_baseUrl$path')));
  }

  Future<http.Response> _post(String path, Map<String, dynamic> body) {
    return _send(
      () => _client.post(
        Uri.parse('$_baseUrl$path'),
        headers: const {'content-type': 'application/json'},
        body: jsonEncode(body),
      ),
    );
  }

  Future<http.Response> _send(Future<http.Response> Function() request) async {
    final response = await request();
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw EkoTrustApiException(response.statusCode, response.body);
    }
    return response;
  }
}

class EkoTrustApiException implements Exception {
  const EkoTrustApiException(this.statusCode, this.body);

  final int statusCode;
  final String body;

  @override
  String toString() => 'EkoTrustApiException($statusCode): $body';
}
