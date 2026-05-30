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
  static const _queueKeyName = 'ekotrust_mobile_offline_queue_key_v1';

  final FlutterSecureStorage _secureStorage;
  final AesGcm _cipher;

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB('ekotrust_offline.db');
    return _database!;
  }

  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, filePath);

    final db = await openDatabase(
      path,
      version: 4,
      onCreate: _createDB,
      onUpgrade: _upgradeDB,
    );

    await _recoverInterruptedUploads(db);
    return db;
  }

  Future<void> _createDB(Database db, int version) async {
    await db.execute('''
      CREATE TABLE proof_queue (
        id TEXT PRIMARY KEY,
        client_mutation_id TEXT NOT NULL UNIQUE,
        payload_ciphertext TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        attempt_count INTEGER NOT NULL DEFAULT 0,
        server_proof_id TEXT,
        last_error TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        last_attempt_at TEXT
      )
    ''');

    await db.execute('''
      CREATE INDEX proof_queue_status_created_idx
      ON proof_queue(status, created_at)
    ''');

    await _createWorkProofsTable(db);
    await _createProfileStateTable(db);
  }

  Future<void> _upgradeDB(Database db, int oldVersion, int newVersion) async {
    if (oldVersion < 2) {
      await db.execute(
          'ALTER TABLE proof_queue RENAME TO proof_queue_legacy_plaintext');
      await _createDB(db, newVersion);
    }
    if (oldVersion < 3) {
      await _createWorkProofsTable(db);
    }
    if (oldVersion < 4) {
      await _createProfileStateTable(db);
      await _addColumnIfMissing(
          db, 'work_proofs', 'synced', 'INTEGER NOT NULL DEFAULT 0');
      await _addColumnIfMissing(
          db, 'work_proofs', 'evidence_before_path', 'TEXT');
      await _addColumnIfMissing(
          db, 'work_proofs', 'evidence_after_path', 'TEXT');
      await _addColumnIfMissing(db, 'work_proofs', 'evidence_hash', 'TEXT');
    }
  }

  Future<void> _createWorkProofsTable(Database db) async {
    await db.execute('''
      CREATE TABLE IF NOT EXISTS work_proofs (
        id TEXT PRIMARY KEY,
        artisan_id TEXT NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        location TEXT NOT NULL,
        status TEXT NOT NULL,
        summary TEXT NOT NULL,
        synced INTEGER NOT NULL DEFAULT 0,
        evidence_before_path TEXT,
        evidence_after_path TEXT,
        evidence_hash TEXT,
        created_at TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE INDEX IF NOT EXISTS work_proofs_artisan_created_idx
      ON work_proofs(artisan_id, created_at DESC)
    ''');
  }

  Future<void> _createProfileStateTable(Database db) async {
    await db.execute('''
      CREATE TABLE IF NOT EXISTS profile_state (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    ''');
  }

  Future<void> _addColumnIfMissing(
    Database db,
    String table,
    String column,
    String definition,
  ) async {
    final rows = await db.rawQuery('PRAGMA table_info($table)');
    final exists = rows.any((row) => row['name'] == column);
    if (!exists) {
      await db.execute('ALTER TABLE $table ADD COLUMN $column $definition');
    }
  }

  Future<void> recoverInterruptedUploads() async {
    final db = await database;
    await _recoverInterruptedUploads(db);
  }

  Future<void> _recoverInterruptedUploads(Database db) async {
    await db.update(
      'proof_queue',
      {
        'status': 'pending',
        'updated_at': DateTime.now().toUtc().toIso8601String(),
      },
      where: "status = 'syncing'",
    );
  }

  Future<void> queueProof(Map<String, dynamic> proof) async {
    final db = await database;
    final now = DateTime.now().toUtc().toIso8601String();
    final clientMutationId = (proof['clientMutationId'] ??
            proof['id'] ??
            'mobile-${DateTime.now().microsecondsSinceEpoch}-${Random.secure().nextInt(1 << 32)}')
        .toString();
    final payload = {
      ...proof,
      'clientMutationId': clientMutationId,
    };
    final encryptedPayload = await _encryptJson(payload);

    await db.transaction((txn) async {
      await txn.insert(
        'proof_queue',
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

  Future<List<Map<String, dynamic>>> getPendingProofs({int limit = 25}) async {
    final db = await database;
    final rows = await db.query(
      'proof_queue',
      where: "status IN ('pending', 'failed')",
      orderBy: 'created_at ASC',
      limit: limit,
    );

    final proofs = <Map<String, dynamic>>[];
    for (final row in rows) {
      final payload = await _decryptJson(row['payload_ciphertext'] as String);
      proofs.add({
        ...payload,
        'queueId': row['id'],
        'clientMutationId': row['client_mutation_id'],
        'attemptCount': row['attempt_count'],
      });
    }
    return proofs;
  }

  Future<void> markSyncing(List<String> clientMutationIds) async {
    if (clientMutationIds.isEmpty) return;

    final db = await database;
    final now = DateTime.now().toUtc().toIso8601String();
    await db.transaction((txn) async {
      for (final id in clientMutationIds) {
        await txn.update(
          'proof_queue',
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
          UPDATE proof_queue
          SET attempt_count = attempt_count + 1
          WHERE client_mutation_id = ?
          ''',
          [id],
        );
      }
    });
  }

  Future<void> markSynced(String clientMutationId, String serverProofId) async {
    final db = await database;
    await db.update(
      'proof_queue',
      {
        'status': 'synced',
        'server_proof_id': serverProofId,
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
      'proof_queue',
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
      FROM proof_queue
      GROUP BY status
    ''');

    return {
      for (final row in rows) row['status'] as String: row['count'] as int,
    };
  }

  Future<void> saveWorkProof(Map<String, dynamic> proof) async {
    final db = await database;
    final now = DateTime.now().toUtc().toIso8601String();
    await db.insert(
      'work_proofs',
      {
        'id': proof['id'].toString(),
        'artisan_id': proof['artisanId'].toString(),
        'title': proof['title'].toString(),
        'category': proof['category'].toString(),
        'location': proof['location'].toString(),
        'status': proof['status'].toString(),
        'summary': proof['summary'].toString(),
        'synced': proof['synced'] == true ? 1 : 0,
        if (proof['evidenceBeforePath'] != null)
          'evidence_before_path': proof['evidenceBeforePath'].toString(),
        if (proof['evidenceAfterPath'] != null)
          'evidence_after_path': proof['evidenceAfterPath'].toString(),
        if (proof['evidenceHash'] != null)
          'evidence_hash': proof['evidenceHash'].toString(),
        'created_at': (proof['createdAt'] ?? now).toString(),
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<Map<String, dynamic>>> listWorkProofs(String artisanId) async {
    final db = await database;
    final rows = await db.query(
      'work_proofs',
      where: 'artisan_id = ?',
      whereArgs: [artisanId],
      orderBy: 'created_at DESC',
    );

    return rows
        .map(
          (row) => {
            'id': row['id'],
            'artisanId': row['artisan_id'],
            'title': row['title'],
            'category': row['category'],
            'location': row['location'],
            'status': row['status'],
            'summary': row['summary'],
            'synced': row['synced'],
            'evidenceBeforePath': row['evidence_before_path'],
            'evidenceAfterPath': row['evidence_after_path'],
            'evidenceHash': row['evidence_hash'],
            'createdAt': row['created_at'],
          },
        )
        .toList(growable: false);
  }

  Future<void> markWorkProofSynced(String id) async {
    final db = await database;
    await db.update(
      'work_proofs',
      {'synced': 1},
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  Future<void> setProfileState(String key, Object? value) async {
    final db = await database;
    await db.insert(
      'profile_state',
      {
        'key': key,
        'value': jsonEncode(value),
        'updated_at': DateTime.now().toUtc().toIso8601String(),
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<T?> getProfileState<T>(String key) async {
    final db = await database;
    final rows = await db.query(
      'profile_state',
      where: 'key = ?',
      whereArgs: [key],
      limit: 1,
    );
    if (rows.isEmpty) return null;
    try {
      return jsonDecode(rows.first['value'].toString()) as T?;
    } catch (_) {
      return null;
    }
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

    final keyBytes =
        List<int>.generate(32, (_) => Random.secure().nextInt(256));
    await _secureStorage.write(
        key: _queueKeyName, value: base64Encode(keyBytes));
    return SecretKey(keyBytes);
  }
}
