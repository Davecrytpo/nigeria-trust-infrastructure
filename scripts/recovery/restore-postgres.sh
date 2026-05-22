#!/usr/bin/env sh
set -eu

if [ "$#" -ne 1 ]; then
  echo "Usage: sh scripts/recovery/restore-postgres.sh <backup.dump>" >&2
  exit 1
fi

COMPOSE_FILE="${COMPOSE_FILE:-compose.production.yaml}"
BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

cat "$BACKUP_FILE" | docker compose -f "$COMPOSE_FILE" exec -T postgres pg_restore \
  -U nigeria_trust \
  -d nigeria_trust \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl

printf '{"restoredAt":"%s","backupFile":"%s"}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$BACKUP_FILE" \
  >"$BACKUP_FILE.restore.json"

echo "restored $BACKUP_FILE"
