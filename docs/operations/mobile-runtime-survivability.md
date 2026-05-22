# Mobile Runtime Survivability

This note documents the executable mobile recovery path now present in the repository.

## Offline Queue

Flutter service:

```text
apps/resident-mobile/lib/core/infrastructure/offline_sync_service.dart
```

Runtime behavior:

- Persists emergency incidents before network upload.
- Encrypts queued payloads with AES-GCM.
- Stores the encryption key in platform secure storage.
- Uses `clientMutationId` as the durable replay/idempotency key.
- Recovers interrupted `syncing` rows back to `pending` on startup.
- Tracks `pending`, `syncing`, `failed`, and `synced` queue states.
- Preserves legacy plaintext queue rows in `incident_queue_legacy_plaintext` during schema upgrade instead of dropping them.

## Mobile Replay API

Endpoint:

```text
POST /api/mobile/sync
```

Body:

```json
{
  "incidents": [
    {
      "clientMutationId": "mobile-unique-id",
      "incidentType": "medical",
      "severity": "high",
      "locationNote": "Queued during offline mode.",
      "sharePreciseLocation": true
    }
  ]
}
```

Server behavior:

- Creates incidents through the same operational path as live submissions.
- Stores `clientMutationId` on incidents.
- Suppresses duplicate replays with the same `clientMutationId`.
- Returns server incident IDs, status, version, and replay status.
- PostgreSQL uses a partial unique index on `client_mutation_id`.

## Mobile Repository Recovery Flow

Flutter repository:

```text
apps/resident-mobile/lib/features/emergency/infrastructure/emergency_repository.dart
```

Runtime behavior:

- Queues the incident locally before attempting upload.
- Marks successful uploads as `synced`.
- Marks failed uploads as `failed` and leaves them replayable.
- Batches pending incidents through `/api/mobile/sync`.
- Restores interrupted uploads before batch replay.

## Validation

Current local validation:

```powershell
npm.cmd test
npm.cmd run field:test
npm.cmd run field:stress
npm.cmd run field:convergence
```

Current blocker:

- Flutter tooling is not installed on this Windows host, so Dart compilation and real Android process-death/reboot tests were not executed here.
- Real-device validation still requires an Android device or emulator with Flutter installed.
