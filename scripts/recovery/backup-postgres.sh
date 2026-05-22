#!/usr/bin/env sh
set -eu

COMPOSE_FILE="${COMPOSE_FILE:-compose.production.yaml}"
BACKUP_DIR="${BACKUP_DIR:-reports/backups}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_FILE="$BACKUP_DIR/postgres-$STAMP.dump"

mkdir -p "$BACKUP_DIR"

docker compose -f "$COMPOSE_FILE" exec -T postgres pg_dump \
  -U nigeria_trust \
  -d nigeria_trust \
  --format=custom \
  --no-owner \
  --no-acl \
  >"$BACKUP_FILE"

printf '{"createdAt":"%s","backupFile":"%s","format":"pg_dump_custom"}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$BACKUP_FILE" \
  >"$BACKUP_FILE.json"

echo "$BACKUP_FILE"
