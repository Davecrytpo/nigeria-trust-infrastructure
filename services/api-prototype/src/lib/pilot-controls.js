const DEFAULT_ALLOWED_INCIDENT_TYPES = ["medical", "help"];
const DEFAULT_ALLOWED_SEVERITIES = ["moderate", "high"];

export function createPilotControls(options = {}) {
  const enabled = options.enabled ?? process.env.PILOT_MODE === "1";
  let shutdown = Boolean(options.shutdown);
  const allowedIncidentTypes = new Set(
    options.allowedIncidentTypes ??
    (process.env.PILOT_ALLOWED_INCIDENT_TYPES?.split(",").map((item) => item.trim()).filter(Boolean)) ??
    DEFAULT_ALLOWED_INCIDENT_TYPES
  );
  const allowedSeverities = new Set(
    options.allowedSeverities ??
    (process.env.PILOT_ALLOWED_SEVERITIES?.split(",").map((item) => item.trim()).filter(Boolean)) ??
    DEFAULT_ALLOWED_SEVERITIES
  );
  const maxOperatorConcurrency = Number(options.maxOperatorConcurrency ?? process.env.PILOT_MAX_OPERATOR_CONCURRENCY ?? 3);
  const activeOperators = new Set();

  function enforceIncident(payload) {
    if (!enabled) return { allowed: true };
    if (shutdown) {
      return {
        allowed: false,
        statusCode: 503,
        code: "PILOT_SHUTDOWN_ACTIVE",
        error: "Pilot shutdown is active."
      };
    }
    if (!allowedIncidentTypes.has(payload.incidentType ?? payload.type)) {
      return {
        allowed: false,
        statusCode: 403,
        code: "PILOT_INCIDENT_TYPE_RESTRICTED",
        error: "Incident type is outside the controlled pilot scope."
      };
    }
    if (!allowedSeverities.has(payload.severity)) {
      return {
        allowed: false,
        statusCode: 403,
        code: "PILOT_SEVERITY_RESTRICTED",
        error: "Incident severity requires out-of-band supervisor handling during pilot mode."
      };
    }

    return { allowed: true };
  }

  function enforceOperator(operatorRef) {
    if (!enabled) return { allowed: true };
    if (shutdown) {
      return {
        allowed: false,
        statusCode: 503,
        code: "PILOT_SHUTDOWN_ACTIVE",
        error: "Pilot shutdown is active."
      };
    }
    activeOperators.add(operatorRef);
    if (activeOperators.size > maxOperatorConcurrency) {
      activeOperators.delete(operatorRef);
      return {
        allowed: false,
        statusCode: 429,
        code: "PILOT_OPERATOR_CONCURRENCY_LIMIT",
        error: "Pilot operator concurrency limit reached."
      };
    }

    return { allowed: true };
  }

  return {
    get enabled() {
      return enabled;
    },
    get shutdown() {
      return shutdown;
    },
    setShutdown(value) {
      shutdown = Boolean(value);
      return { enabled, shutdown };
    },
    status() {
      return {
        enabled,
        shutdown,
        allowedIncidentTypes: [...allowedIncidentTypes],
        allowedSeverities: [...allowedSeverities],
        maxOperatorConcurrency,
        activeOperatorCount: activeOperators.size
      };
    },
    enforceIncident,
    enforceOperator
  };
}
