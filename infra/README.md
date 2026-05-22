# Infrastructure

Purpose: deployment and environment definitions for the operational execution stack.

## Current Execution Baseline

- `../Dockerfile` builds the prototype API, resident PWA, ops console, and shared assets into a Node 24 container.
- `../compose.production.yaml` runs the API with Redis append-only persistence and PostGIS for the production data path.
- `k8s/api-deployment.yaml` defines a horizontally scalable API deployment with readiness/liveness probes and HPA.
- `k8s/redis.yaml` defines a durable Redis event-pipeline baseline.
- `k8s/postgis.yaml` defines a PostGIS stateful baseline for geospatial incident storage.
- `k8s/secrets.example.yaml` documents the required runtime secrets without committing real credentials.
- `db/*.sql` contains the PostGIS, incident event, delivery outbox, telecom receipt, dead-letter, and immutable audit schema.

## Runtime Infrastructure Activation

- Set `REDIS_URL=redis://nigeria-trust-redis:6379` to mirror incident events, delivery outbox jobs, and telecom receipts into Redis Streams:
  - `nti:incident-events`
  - `nti:delivery-outbox`
  - `nti:telecom-receipts`
- Set `DATABASE_URL=postgres://...` and run `npm.cmd run db:migrate` to apply the production PostGIS schema.
- Run `npm.cmd run db:seed` after migrations to provision initial Yaba responders and operator accounts.
- When `DATABASE_URL` is set, the API runtime selects the Postgres-backed operational store instead of the local file-backed fallback.
- Set provider credentials before enabling live SMS:
  - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`
  - `AFRICAS_TALKING_API_KEY`, `AFRICAS_TALKING_USERNAME`, optional `AFRICAS_TALKING_FROM`
- `INFOBIP_API_KEY`, `INFOBIP_BASE_URL`, `INFOBIP_FROM`
- Set `TELECOM_WEBHOOK_SIGNATURE_REQUIRED=1` and provider-specific `TELECOM_WEBHOOK_SECRET_<PROVIDER>` values before accepting live telecom receipt callbacks.
- Configure `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX_REQUESTS` for public incident and mobile sync abuse protection.
- Set `OPERATOR_SESSION_SECRET`, `OPERATOR_SESSION_TTL_SECONDS`, and optionally `OPERATOR_SESSION_KEY_ID` for signed operator sessions.
- Set `PILOT_MODE=1`, `PILOT_ALLOWED_INCIDENT_TYPES=medical,help`, `PILOT_ALLOWED_SEVERITIES=moderate,high`, and `PILOT_MAX_OPERATOR_CONCURRENCY=3` for constrained Yaba pilot execution.

## Workers And Recovery

- `npm.cmd run worker:delivery` starts a Redis consumer-group worker for `nti:delivery-outbox`.
- `npm.cmd run worker:replay` records replay stream observations into immutable audit records.
- `npm.cmd run worker:operator-queue` creates durable operator queue items from incident events.
- `npm.cmd run worker:trust-quarantine` creates trust review records from high-risk event signals.
- `npm.cmd run worker:escalation` raises queue priority for high/critical incident events.
- `npm.cmd run worker:dead-letter-replay` requeues persisted dead-letter deliveries.
- `npm.cmd run recovery:redis` rebuilds Redis Streams from Postgres after Redis loss or cold-start recovery.
- `npm run backup:postgres` captures a Docker Compose Postgres custom-format backup under `reports/backups`.
- `npm run restore:postgres -- <backup.dump>` restores a captured backup into the Compose Postgres service.
- Delivery workers are idempotent at stream acknowledgment level: messages are acknowledged only after processing succeeds.
- Poison messages remain pending for retry and can be moved into dead-letter recovery workflows.

## Operator Queue Runtime

Production operator queue state is stored in Postgres:

- `POST /api/ops/queue/claim` locks the highest-priority available queue item using row-level locking.
- `POST /api/ops/queue/:id/release` releases an operator-owned item back to the queue.
- `POST /api/ops/queue/:id/reassign` lets a supervisor transfer ownership.
- `/api/metrics` exports `nti_operator_queue_queued` for runtime visibility.

## Live Runtime Validation

Run the distributed runtime drill with Docker available:

```bash
npm.cmd run runtime:validate
```

The drill starts PostGIS, Redis, API, delivery worker, replay worker, and operator queue worker; runs migrations; creates concurrent incidents; validates replay; restarts API/workers; restarts Redis; and rebuilds Redis streams from Postgres.

Run controlled failure drills:

```bash
npm.cmd run runtime:failure-drills
```

These drills restart API, workers, Redis, and Postgres while validating incident continuity and replay recovery.

## VPS Runtime Proof

On an Ubuntu VPS, bootstrap the host:

```bash
sudo sh scripts/host/bootstrap-linux-vps.sh
```

Before runtime proof, complete the operational deployment package:

- `../docs/operations/operational-deployment-preparation.md`
- `../docs/operations/live-runbooks.md`
- `../docs/operations/android-deployment-preparation.md`
- `../docs/operations/telecom-execution-preparation.md`
- `../docs/operations/controlled-pilot-operational-package.md`

Create a production `.env` before running live proof:

```bash
OPS_ACCESS_KEY=<strong operator key>
POSTGRES_PASSWORD=<strong postgres password>
GRAFANA_ADMIN_PASSWORD=<strong grafana password>
```

Use `../.env.production.example` as the production environment specification.

Run host preflight before starting the production proof:

```bash
sh scripts/host/preflight-linux-vps.sh
```

Run the full production stack, observability stack, runtime validation, failure drills, evidence capture, and readiness dossier generation:

```bash
sh scripts/host/run-vps-runtime-proof.sh
```

Outputs:

- Raw command evidence: `reports/runtime/evidence-*/`
- Runtime validation reports: `reports/runtime/runtime-validation-*.json`
- Failure drill reports: `reports/runtime/failure-drills-*.json`
- Readiness dossier: `reports/readiness/operational-readiness-dossier-*.json`

By default `KEEP_STACK=1` leaves the stack running for inspection. To tear down after proof:

```bash
KEEP_STACK=0 sh scripts/host/run-vps-runtime-proof.sh
```

The readiness dossier is evidence-gated. It remains `evidence-incomplete` until live container drills, mobile device validation, and required runtime evidence are present.

## Pilot Operational Controls

Pilot-mode API controls:

- `POST /api/ops/pilot/shutdown` activates or clears shutdown. Supervisor/admin role or bootstrap ops key required.
- `GET /api/ops/pilot/status` exposes active pilot constraints.
- Public incident creation and mobile sync are rejected when pilot shutdown is active.
- Public incident creation and mobile sync are restricted to configured pilot incident types and severity levels.
- Operator queue claims are limited by `PILOT_MAX_OPERATOR_CONCURRENCY`.
- `/api/metrics` exports `nti_pilot_shutdown_active`.

Run security control validation:

```bash
npm run security:audit
```

The audit writes `reports/security/security-audit-*.json` and is included in readiness dossier generation.

## Observability

Start Prometheus, Grafana, Redis exporter, and Postgres exporter with:

```bash
docker compose -f compose.production.yaml -f compose.observability.yaml up -d
```

Endpoints:

- API metrics: `http://<host>:3000/api/metrics`
- Prometheus: `http://<host>:9090`
- Grafana: `http://<host>:3001`

Grafana starts with a runtime overview dashboard provisioned from `infra/observability/grafana/dashboards`.

## Operational Controls Represented In Field Gates

The field gates now model concrete deployment controls:

- Durable encrypted WAL-style offline queue behavior.
- Idempotent offline replay and deterministic replay ordering.
- Queue corruption quarantine.
- SMS provider failover, receipt reconciliation, USSD fallback, and cross-provider receipt audit.
- Android app-kill recovery, low-battery SOS mode, and background SOS recovery.
- Operator surge routing, queue partitioning, incident triage UX, and shift handoff protection.
- Responder load balancing, acknowledgment escalation, scarcity dispatch, and regional clustering.
- Device attestation, spam quarantine, trust mutation audit, and duress review gate.

## Remaining Production Work

- Exercise Postgres-backed state in integration tests against a live PostGIS container.
- Add Redis consumer groups for replay jobs, operator queue events, trust quarantine review, and dead-letter replay.
- Add OpenTelemetry tracing and reliability dashboards.
- Add Flutter offline queue encryption and Android background execution validation.
- Add production ingress, TLS, rate limits, WAF rules, and multi-region failover manifests.
