import 'dart:convert';
import 'dart:math';

import 'package:cryptography/cryptography.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';

class OfflineSyncService {
  OfflineSyncService({
    FlutterSecureStorage? secureStorage,
    AesGcm? cipher,
  })  : _secureStorage = secureStorage ?? const FlutterSecureStorage(),
        _cipher = cipher ?? AesGcm.with256bits();

  static Database? _database;
  static const _queueKeyName = 'resident_mobile_offline_queue_key_v1';

  final FlutterSecureStorage _secureStorage;
  final AesGcm _cipher;

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB('emergency_offline.db');
    return _database!;
  }

  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, filePath);

    final db = await openDatabase(
      path,
      version: 2,
      onCreate: _createDB,
      onUpgrade: _upgradeDB,
    );

    await _recoverInterruptedUploads(db);
    return db;
  }

  Future<void> _createDB(Database db, int version) async {
    await db.execute('''
      CREATE TABLE incident_queue (
        id TEXT PRIMARY KEY,
        client_mutation_id TEXT NOT NULL UNIQUE,
        payload_ciphertext TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        attempt_count INTEGER NOT NULL DEFAULT 0,
        server_incident_id TEXT,
        last_error TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        last_attempt_at TEXT
      )
    ''');

    await db.execute('''
      CREATE INDEX incident_queue_status_created_idx
      ON incident_queue(status, created_at)
    ''');
  }

  Future<void> _upgradeDB(Database db, int oldVersion, int newVersion) async {
    if (oldVersion < 2) {
      await db.execute('ALTER TABLE incident_queue RENAME TO incident_queue_legacy_plaintext');
      await _createDB(db, newVersion);
    }
  }

  Future<void> recoverInterruptedUploads() async {
    final db = await database;
    await _recoverInterruptedUploads(db);
  }

  Future<void> _recoverInterruptedUploads(Database db) async {
    await db.update(
      'incident_queue',
      {
        'status': 'pending',
        'updated_at': DateTime.now().toUtc().toIso8601String(),
      },
      where: "status = 'syncing'",
    );
  }

  Future<void> queueIncident(Map<String, dynamic> incident) async {
    final db = await database;
    final now = DateTime.now().toUtc().toIso8601String();
    final clientMutationId = (incident['clientMutationId'] ??
            incident['id'] ??
            'mobile-${DateTime.now().microsecondsSinceEpoch}-${Random.secure().nextInt(1 << 32)}')
        .toString();
    final payload = {
      ...incident,
      'clientMutationId': clientMutationId,
    };
    final encryptedPayload = await _encryptJson(payload);

    await db.transaction((txn) async {
      await txn.insert(
        'incident_queue',
        {
          'id': clientMutationId,
          'client_mutation_id': clientMutationId,
          'payload_ciphertext': encryptedPayload,
          'status': 'pending',
          'attempt_count': 0,
          'created_at': now,
          'updated_at': now,
        },
        conflictAlgorithm: ConflictAlgorithm.ignore,
      );
    });
  }

  Future<List<Map<String, dynamic>>> getPendingIncidents({int limit = 25}) async {
    final db = await database;
    final rows = await db.query(
      'incident_queue',
      where: "status IN ('pending', 'failed')",
      orderBy: 'created_at ASC',
      limit: limit,
    );

    final incidents = <Map<String, dynamic>>[];
    for (final row in rows) {
      final payload = await _decryptJson(row['payload_ciphertext'] as String);
      incidents.add({
        ...payload,
        'queueId': row['id'],
        'clientMutationId': row['client_mutation_id'],
        'attemptCount': row['attempt_count'],
      });
    }
    return incidents;
  }

  Future<void> markSyncing(List<String> clientMutationIds) async {
    if (clientMutationIds.isEmpty) return;

    final db = await database;
    final now = DateTime.now().toUtc().toIso8601String();
    await db.transaction((txn) async {
      for (final id in clientMutationIds) {
        await txn.update(
          'incident_queue',
          {
            'status': 'syncing',
            'updated_at': now,
            'last_attempt_at': now,
          },
          where: "client_mutation_id = ? AND status != 'synced'",
          whereArgs: [id],
        );
        await txn.rawUpdate(
          '''
          UPDATE incident_queue
          SET attempt_count = attempt_count + 1
          WHERE client_mutation_id = ?
          ''',
          [id],
        );
      }
    });
  }

  Future<void> markSynced(String clientMutationId, String serverIncidentId) async {
    final db = await database;
    await db.update(
      'incident_queue',
      {
        'status': 'synced',
        'server_incident_id': serverIncidentId,
        'last_error': null,
        'updated_at': DateTime.now().toUtc().toIso8601String(),
      },
      where: 'client_mutation_id = ?',
      whereArgs: [clientMutationId],
    );
  }

  Future<void> markFailed(String clientMutationId, Object error) async {
    final db = await database;
    await db.update(
      'incident_queue',
      {
        'status': 'failed',
        'last_error': error.toString(),
        'updated_at': DateTime.now().toUtc().toIso8601String(),
      },
      where: "client_mutation_id = ? AND status != 'synced'",
      whereArgs: [clientMutationId],
    );
  }

  Future<Map<String, int>> queueStats() async {
    final db = await database;
    final rows = await db.rawQuery('''
      SELECT status, COUNT(*) AS count
      FROM incident_queue
      GROUP BY status
    ''');

    return {
      for (final row in rows) row['status'] as String: row['count'] as int,
    };
  }

  Future<String> _encryptJson(Map<String, dynamic> payload) async {
    final key = await _getOrCreateQueueKey();
    final nonce = _cipher.newNonce();
    final secretBox = await _cipher.encrypt(
      utf8.encode(jsonEncode(payload)),
      secretKey: key,
      nonce: nonce,
    );

    return jsonEncode({
      'nonce': base64Encode(secretBox.nonce),
      'cipherText': base64Encode(secretBox.cipherText),
      'mac': base64Encode(secretBox.mac.bytes),
    });
  }

  Future<Map<String, dynamic>> _decryptJson(String encryptedPayload) async {
    final envelope = jsonDecode(encryptedPayload) as Map<String, dynamic>;
    final key = await _getOrCreateQueueKey();
    final secretBox = SecretBox(
      base64Decode(envelope['cipherText'] as String),
      nonce: base64Decode(envelope['nonce'] as String),
      mac: Mac(base64Decode(envelope['mac'] as String)),
    );
    final clearText = await _cipher.decrypt(secretBox, secretKey: key);
    return jsonDecode(utf8.decode(clearText)) as Map<String, dynamic>;
  }

  Future<SecretKey> _getOrCreateQueueKey() async {
    final existing = await _secureStorage.read(key: _queueKeyName);
    if (existing != null) {
      return SecretKey(base64Decode(existing));
    }

    final keyBytes = List<int>.generate(32, (_) => Random.secure().nextInt(256));
    await _secureStorage.write(key: _queueKeyName, value: base64Encode(keyBytes));
    return SecretKey(keyBytes);
  }
}
