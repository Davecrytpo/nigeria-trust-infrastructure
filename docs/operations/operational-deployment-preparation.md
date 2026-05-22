# Operational Deployment Preparation

This document is for real Linux VPS deployment preparation only. It does not certify readiness. Readiness requires signed runtime evidence from the VPS, telecom providers, Android devices, recovery drills, operational metrics, and security reports.

## Deployment Checklist

- VPS is Ubuntu LTS or equivalent Linux host with root/sudo access.
- DNS records are prepared for API, Grafana, Prometheus, and telecom webhooks.
- TLS termination is available before public pilot traffic is accepted.
- `.env` is created from `.env.production.example` on the VPS and is not committed.
- Docker, Docker Compose plugin, Node, npm, curl, git, and firewall tooling are installed.
- Ports are either private behind a reverse proxy or intentionally exposed: API `3000`, Grafana `3001`, Prometheus `9090`, Redis exporter `9121`, Postgres exporter `9187`.
- Production stack is started only after preflight passes.
- Runtime proof is captured under `reports/runtime/evidence-*`.
- Readiness dossier and manifest are regenerated after runtime proof.

## Production Secret Requirements

- `OPS_ACCESS_KEY`: bootstrap operational key. Use a high-entropy value and rotate after initial operator sessions are created.
- `POSTGRES_PASSWORD`: Postgres service password.
- `GRAFANA_ADMIN_PASSWORD`: Grafana administrator password.
- `OPERATOR_SESSION_SECRET`: signing secret for operator sessions.
- `OPERATOR_SESSION_KEY_ID`: current signing key identifier for rotation evidence.
- `TELECOM_WEBHOOK_SECRET_TWILIO`, `TELECOM_WEBHOOK_SECRET_AFRICAS_TALKING`, `TELECOM_WEBHOOK_SECRET_INFOBIP`: provider callback verification secrets where supported.
- Provider credentials for Twilio, Africa's Talking, and Infobip.

Use `openssl rand -base64 48` for each non-provider secret. Store production secrets in the VPS secret manager or root-readable deployment file. Do not place real credentials in docs, screenshots, or reports.

## Production Environment Specification

The canonical template is `.env.production.example`.

Required non-telecom keys:

- `OPS_ACCESS_KEY`
- `POSTGRES_PASSWORD`
- `GRAFANA_ADMIN_PASSWORD`
- `OPERATOR_SESSION_SECRET`
- `PUBLIC_BASE_URL`
- `TELECOM_WEBHOOK_URLS`
- `TELECOM_WEBHOOK_SIGNATURE_REQUIRED=1`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX_REQUESTS`

Required telecom keys:

- Twilio: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`
- Africa's Talking: `AFRICAS_TALKING_API_KEY`, `AFRICAS_TALKING_USERNAME`, optional `AFRICAS_TALKING_FROM`
- Infobip: `INFOBIP_API_KEY`, `INFOBIP_BASE_URL`, `INFOBIP_FROM`
- Live validation: `TELECOM_TEST_TO`

## SSH Deployment Flow

1. SSH to the VPS as the deployment user.
2. Install host dependencies:

```bash
sudo sh scripts/host/bootstrap-linux-vps.sh
```

3. Install Node 24 and npm if not already present. The preflight requires `node` and `npm` because the proof scripts run host-side validation.
4. Create `.env` from `.env.production.example` with real secrets.
5. Run:

```bash
sh scripts/host/preflight-linux-vps.sh
```

Preflight validates Docker, Docker Compose, Node, npm, required ports, environment completeness, Compose configuration, optional public HTTPS, optional DNS, and optional telecom webhook URL reachability.

6. Start the full proof run:

```bash
sh scripts/host/run-vps-runtime-proof.sh
```

7. Preserve `reports/runtime/evidence-*`, `reports/readiness/*.json`, and `reports/manifest.json`.

## Startup Sequencing

The production Compose file enforces this sequence:

1. `postgres` starts and becomes healthy.
2. `migrate` applies `infra/db/*.sql`.
3. `seed` provisions initial operational data.
4. `redis` starts with append-only persistence.
5. `api` starts after `seed` completes and Redis starts.
6. `delivery-worker`, `replay-worker`, and `operator-queue-worker` start.
7. Observability services start from `compose.observability.yaml`.

## Observability Startup Flow

Start runtime plus observability:

```bash
docker compose -f compose.production.yaml -f compose.observability.yaml up --build -d
```

Verify:

- API health: `curl -fsS http://127.0.0.1:3000/api/health`
- API metrics: `curl -fsS http://127.0.0.1:3000/api/metrics`
- Prometheus health: `curl -fsS http://127.0.0.1:9090/-/healthy`
- Grafana health: `curl -fsS http://127.0.0.1:3001/api/health`

## Backup Verification Flow

1. Run `npm run backup:postgres`.
2. Confirm a new dump exists under `reports/backups`.
3. Restore into a disposable environment before trusting the backup:

```bash
npm run restore:postgres -- reports/backups/<backup-file>.dump
```

4. Run `npm run runtime:validate` after restore.
5. Record the backup filename, restore timestamp, and validation report in the readiness dossier.

## Rollback Procedure

1. Stop intake by activating pilot shutdown if the API is reachable.
2. Capture logs:

```bash
docker compose -f compose.production.yaml -f compose.observability.yaml logs --no-color --tail=1000 > reports/runtime/rollback-logs.txt
```

3. Back up Postgres before destructive rollback.
4. Revert to the last known image/source revision.
5. Run migrations only if rollback documentation confirms compatibility.
6. Restart stack and verify health, metrics, SSE, replay, and queue processing.
7. Keep pilot shutdown active until supervisor review clears restart.

## Runtime Verification Checklist

- Compose services are running.
- Migrations completed successfully.
- Seed completed successfully.
- API health endpoint returns success.
- API metrics expose operational counters.
- Redis append-only persistence is enabled.
- Postgres volume persists across container restart.
- Workers are running and restartable.
- SSE reconnect emits authoritative snapshot.
- Prometheus scrapes API, Redis exporter, and Postgres exporter.
- Grafana loads with provisioned dashboard.
- API, Redis, and Postgres restart recovery reports are present.

## Sizing Recommendations

Minimum pilot VPS:

- 2 vCPU, 4 GB RAM, 80 GB SSD.
- Redis append-only storage on persistent disk.
- Postgres volume on persistent SSD.
- Daily Postgres backup off-host.

Preferred supervised pilot VPS:

- 4 vCPU, 8 GB RAM, 160 GB SSD.
- Separate backup target.
- Reverse proxy with TLS.
- Private access for Grafana and Prometheus.

These are starting recommendations, not capacity claims. Capacity must be adjusted from live metrics.
