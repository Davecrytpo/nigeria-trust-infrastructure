# Real-Time Distributed Synchronization

This note documents the current executable synchronization layer for the operator runtime.

## Live Operator Stream

Endpoint:

```text
GET /api/ops/events?opsKey=<OPS_ACCESS_KEY>&operatorRef=<operator-ref>
```

Behavior:

- Uses Server-Sent Events so the browser receives live operational updates without polling-only behavior.
- Emits `connected` on stream setup.
- Emits `dashboard.snapshot` immediately after connection with the current authoritative dashboard state.
- Emits `heartbeat` every 15 seconds to keep reverse proxies and clients aware of stream liveness.
- Cleans up stream intervals on disconnect and server shutdown.

Mutation events currently broadcast:

- `incident.created`
- `incident.dispatched`
- `incident.resolved`
- `operator.queue.claimed`
- `operator.queue.released`
- `operator.queue.reassigned`
- `presence.updated`
- `telecom.receipt`

## Presence Heartbeat

Endpoint:

```text
POST /api/ops/presence
```

Required headers:

```text
x-ops-key: <OPS_ACCESS_KEY>
x-operator-ref: <operator-ref>
```

Body:

```json
{
  "actorType": "operator",
  "status": "online"
}
```

Behavior:

- File-backed fallback state stores active presence in `presence`.
- PostgreSQL state stores active presence in `presence_sessions`.
- Presence expires after 45 seconds without renewal.
- The ops console sends a heartbeat every 20 seconds.
- Prometheus metrics expose active presence as `nti_presence_active`.

## Incident Consistency Guards

Current protections:

- Incidents carry a monotonic `version` field.
- Dispatch and resolve transitions increment incident version.
- Duplicate dispatch requests return the existing dispatch state instead of emitting duplicate dispatch events.
- PostgreSQL dispatch uses row-level locking with `FOR UPDATE`.
- Operator queue claim uses `FOR UPDATE SKIP LOCKED` under PostgreSQL.

## Validation Commands

Run locally:

```powershell
npm.cmd test
npm.cmd run field:test
npm.cmd run field:stress
npm.cmd run field:convergence
```

Runtime proof on Docker-capable Linux host:

```bash
npm run runtime:validate
```
