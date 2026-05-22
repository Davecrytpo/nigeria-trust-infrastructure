#!/usr/bin/env sh
set -eu

COMPOSE_FILES="-f compose.production.yaml -f compose.observability.yaml"
REQUIRED_ENV="OPS_ACCESS_KEY POSTGRES_PASSWORD GRAFANA_ADMIN_PASSWORD OPERATOR_SESSION_SECRET TELECOM_WEBHOOK_SIGNATURE_REQUIRED RATE_LIMIT_MAX_REQUESTS RATE_LIMIT_WINDOW_MS TWILIO_ACCOUNT_SID TWILIO_AUTH_TOKEN TWILIO_FROM AFRICAS_TALKING_API_KEY AFRICAS_TALKING_USERNAME INFOBIP_API_KEY INFOBIP_BASE_URL INFOBIP_FROM"
REQUIRED_PORTS="3000 3001 9090 9121 9187"
REPORT_DIR="${REPORT_DIR:-reports/runtime}"
REPORT_FILE="$REPORT_DIR/vps-preflight-$(date -u +%Y%m%dT%H%M%SZ).txt"

mkdir -p "$REPORT_DIR"
: >"$REPORT_FILE"

log() {
  printf '%s\n' "$*" | tee -a "$REPORT_FILE"
}

failures=0

check() {
  name="$1"
  shift
  if "$@" >/tmp/nti-preflight.out 2>/tmp/nti-preflight.err; then
    log "PASS $name"
  else
    failures=$((failures + 1))
    log "FAIL $name"
    sed 's/^/  /' /tmp/nti-preflight.err | tee -a "$REPORT_FILE" >/dev/null || true
  fi
}

check_command() {
  command -v "$1" >/dev/null 2>&1
}

check_port_free() {
  port="$1"
  if command -v ss >/dev/null 2>&1; then
    ! ss -ltn "( sport = :$port )" | grep -q ":$port"
  elif command -v netstat >/dev/null 2>&1; then
    ! netstat -ltn | grep -q ":$port "
  else
    return 0
  fi
}

check_node_version() {
  node -e "const major = Number(process.versions.node.split('.')[0]); process.exit(major >= 24 ? 0 : 1)"
}

check_https_url() {
  url="$1"
  case "$url" in
    https://*) curl -fsSI "$url" >/dev/null ;;
    *) return 1 ;;
  esac
}

check_dns_name() {
  host="$1"
  if command -v getent >/dev/null 2>&1; then
    getent hosts "$host" >/dev/null
  else
    return 0
  fi
}

log "Nigeria Trust Infrastructure VPS preflight"
log "started_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
log "host=$(hostname)"

check "docker installed" check_command docker
check "docker compose installed" docker compose version
check "node installed" check_command node
check "npm installed" check_command npm
check "curl installed" check_command curl
if command -v node >/dev/null 2>&1; then
  check "node version >= 24" check_node_version
fi

for port in $REQUIRED_PORTS; do
  check "port $port available" check_port_free "$port"
done

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
  check "production environment completeness" npm run prod:env:validate

  if [ "${PUBLIC_BASE_URL:-}" ]; then
    public_host="$(printf '%s' "$PUBLIC_BASE_URL" | sed -E 's#^https?://([^/:]+).*#\1#')"
    check "public DNS resolves" check_dns_name "$public_host"
    check "public HTTPS responds" check_https_url "$PUBLIC_BASE_URL"
  else
    log "WARN PUBLIC_BASE_URL not set; skipping DNS/TLS readiness check"
  fi

  if [ "${TELECOM_WEBHOOK_URLS:-}" ]; then
    old_ifs="$IFS"
    IFS=","
    for webhook_url in $TELECOM_WEBHOOK_URLS; do
      check "webhook reachable $webhook_url" check_https_url "$webhook_url"
    done
    IFS="$old_ifs"
  else
    log "WARN TELECOM_WEBHOOK_URLS not set; skipping webhook reachability check"
  fi
else
  failures=$((failures + 1))
  log "FAIL .env present"
fi

check "compose production config valid" docker compose $COMPOSE_FILES config

log "finished_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
log "failures=$failures"
log "report=$REPORT_FILE"

if [ "$failures" -ne 0 ]; then
  exit 1
fi
