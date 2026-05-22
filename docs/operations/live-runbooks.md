# Live Operational Runbooks

These runbooks assume the production Compose stack is deployed on a Linux VPS. Every action must produce logs, timestamps, operator identity, and an evidence file under `reports/`.

## API Restart Recovery

1. Activate pilot shutdown if incident intake is unsafe.
2. Capture current service state:

```bash
docker compose -f compose.production.yaml -f compose.observability.yaml ps
docker compose -f compose.production.yaml logs --no-color --tail=500 api
```

3. Restart API:

```bash
docker compose -f compose.production.yaml restart api
```

4. Verify `curl -fsS http://127.0.0.1:3000/api/health`.
5. Verify `/api/metrics`, operator dashboard, and SSE reconnect.
6. Keep shutdown active if replay, queue, or metrics checks fail.

## Redis Recovery

1. Capture Redis logs and current worker logs.
2. Restart Redis:

```bash
docker compose -f compose.production.yaml restart redis
```

3. Rebuild Redis streams from Postgres:

```bash
docker compose -f compose.production.yaml exec -T api node scripts/recovery/rebuild-redis-from-postgres.js
```

4. Restart workers.
5. Create a low-risk test incident only if pilot supervisor approves.
6. Verify queue replay and duplicate suppression.

## Postgres Restore

1. Activate pilot shutdown.
2. Capture current logs and preserve the current data volume state.
3. Select a backup dump from `reports/backups`.
4. Restore:

```bash
npm run restore:postgres -- reports/backups/<backup-file>.dump
```

5. Restart API and workers.
6. Run runtime validation before reopening intake.

## Worker Crash Recovery

1. Identify failed worker with `docker compose -f compose.production.yaml ps`.
2. Capture logs for the failed worker.
3. Restart the worker:

```bash
docker compose -f compose.production.yaml restart delivery-worker replay-worker operator-queue-worker
```

4. Verify queue lengths and metrics.
5. Run dead-letter replay only after poison-message review.

## Telecom Outage Handling

1. Confirm whether outage is provider-specific or all-provider.
2. Disable unsafe provider routing in operational config if needed.
3. Run a provider-specific live validation with a test number:

```bash
npm run telecom:validate-live -- --providers=twilio --to=<test-number>
```

4. Confirm webhook receipt signature validation.
5. Verify duplicate receipt suppression.
6. Escalate to supervisor if all providers fail or receipts are delayed beyond operational threshold.

## Operator Overload Handling

1. Check `nti_operator_queue_queued` and active operator count.
2. Enforce `PILOT_MAX_OPERATOR_CONCURRENCY`.
3. Reassign only by supervisor action.
4. Move non-urgent items out of active handling if critical incidents are waiting.
5. Record queue depth, staffing count, and decisions in daily review.

## Degraded Mode

Use degraded mode when one or more dependencies are unstable but the supervisor decides limited operation is safer than shutdown.

Required controls:

- Pilot scope remains low-risk only.
- Supervisor approval is explicit.
- Incident intake rate is monitored.
- Telecom provider status is visible.
- Manual escalation path is active.
- Exit requires stable metrics and completed recovery checks.

## Emergency Rollback

1. Activate pilot shutdown.
2. Capture logs and backup Postgres.
3. Stop stack if data corruption or unsafe behavior is ongoing:

```bash
docker compose -f compose.production.yaml -f compose.observability.yaml stop
```

4. Restore last known source/image state.
5. Restart with `docker compose ... up -d`.
6. Run runtime proof before reopening.

## Pilot Shutdown Procedure

1. Supervisor invokes shutdown endpoint or stops intake at the reverse proxy.
2. Operators stop accepting new queue items.
3. Active incidents are resolved or handed off manually.
4. Evidence is frozen: logs, metrics screenshot/export, incident replay, telecom receipts.
5. Daily review documents why shutdown occurred and what condition allows reopening.
