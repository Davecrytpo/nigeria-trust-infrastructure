#!/usr/bin/env sh
set -eu

COMPOSE_FILES="-f compose.production.yaml -f compose.observability.yaml"
REPORT_DIR="${REPORT_DIR:-reports/runtime}"
EVIDENCE_DIR="$REPORT_DIR/evidence-$(date -u +%Y%m%dT%H%M%SZ)"
KEEP_STACK="${KEEP_STACK:-1}"

mkdir -p "$EVIDENCE_DIR"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

capture() {
  name="$1"
  shift
  echo "capturing: $name"
  if "$@" >"$EVIDENCE_DIR/$name.out" 2>"$EVIDENCE_DIR/$name.err"; then
    printf '{"name":"%s","status":"passed","at":"%s"}\n' "$name" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" >>"$EVIDENCE_DIR/commands.ndjson"
  else
    status=$?
    printf '{"name":"%s","status":"failed","exitCode":%s,"at":"%s"}\n' "$name" "$status" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" >>"$EVIDENCE_DIR/commands.ndjson"
    return "$status"
  fi
}

require_command docker
require_command npm
require_command curl

if [ ! -f .env ]; then
  echo "Missing .env. Create it from .env.integration.example or production secrets before running." >&2
  exit 1
fi

capture docker-version docker version
capture docker-compose-version docker compose version
capture node-version node --version
capture npm-version npm --version
capture production-env-validation npm run prod:env:validate

echo "starting production and observability stack"
docker compose $COMPOSE_FILES up --build -d

cleanup() {
  docker compose $COMPOSE_FILES ps >"$EVIDENCE_DIR/compose-ps-final.out" 2>"$EVIDENCE_DIR/compose-ps-final.err" || true
  docker compose $COMPOSE_FILES logs --no-color --tail=500 >"$EVIDENCE_DIR/compose-logs-tail.out" 2>"$EVIDENCE_DIR/compose-logs-tail.err" || true
  if [ "$KEEP_STACK" != "1" ]; then
    docker compose $COMPOSE_FILES down -v || true
  fi
}
trap cleanup EXIT

capture compose-ps-start docker compose $COMPOSE_FILES ps
capture api-health curl -fsS http://127.0.0.1:3000/api/health
capture api-metrics curl -fsS http://127.0.0.1:3000/api/metrics
capture prometheus-health curl -fsS http://127.0.0.1:9090/-/healthy
capture grafana-health curl -fsS http://127.0.0.1:3001/api/health
capture postgres-backup sh scripts/recovery/backup-postgres.sh

echo "running runtime validation"
capture runtime-validate npm run runtime:validate

echo "running failure drills"
capture runtime-failure-drills npm run runtime:failure-drills

capture post-runtime-api-metrics curl -fsS http://127.0.0.1:3000/api/metrics
capture post-runtime-compose-ps docker compose $COMPOSE_FILES ps

echo "$EVIDENCE_DIR" >"$REPORT_DIR/latest-evidence-dir.txt"
npm run evidence:package -- --evidence-dir="$EVIDENCE_DIR"
npm run evidence:hash -- --evidence-dir="$REPORT_DIR"

echo "runtime proof evidence: $EVIDENCE_DIR"
