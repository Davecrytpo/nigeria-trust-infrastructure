const CAPABILITIES = {
  normal: ["app", "sms", "ops-dashboard", "responder-dispatch", "trust-automation", "incident-replay"],
  "telecom-degraded": ["app", "sms-with-confidence-window", "ops-dashboard", "responder-dispatch", "incident-replay"],
  "sms-only": ["sms-intake", "manual-operator-review", "institutional-escalation"],
  "low-trust": ["manual-operator-review", "supervisor-approval", "restricted-dispatch", "incident-replay"],
  "operator-overload": ["priority-triage", "supervisor-escalation", "incident-clustering", "restricted-noncritical-work"],
  "responder-scarcity": ["critical-only-dispatch", "institutional-escalation", "regional-balancing"],
  "disaster-surge": ["clustered-incidents", "broadcast-institutional-alerts", "critical-only-dispatch", "condensed-ops-view"],
  "partial-db-recovery": ["read-only-timeline", "replay-quarantine", "manual-operator-review"],
  "regional-isolation": ["local-queueing", "sms-intake", "regional-autonomy", "delayed-reconciliation"]
};

function addIfActive(modes, condition, mode) {
  if (condition) modes.add(mode);
}

export function evaluateDegradedModes(signal = {}) {
  const modes = new Set();

  addIfActive(modes, (signal.telecomHealthScore ?? 1) < 0.75, "telecom-degraded");
  addIfActive(modes, (signal.appConnectivityRate ?? 1) < 0.35 && (signal.smsAvailabilityRate ?? 0) >= 0.5, "sms-only");
  addIfActive(modes, (signal.trustConfidenceScore ?? 1) < 0.7, "low-trust");
  addIfActive(modes, (signal.operatorLoadPerOperator ?? 0) > 6, "operator-overload");
  addIfActive(modes, (signal.availableResponders ?? 1) / Math.max(signal.activeIncidents ?? 1, 1) < 0.7, "responder-scarcity");
  addIfActive(modes, (signal.activeIncidents ?? 0) >= 25 || (signal.disasterSignals ?? 0) >= 2, "disaster-surge");
  addIfActive(modes, (signal.dbWriteFailureRate ?? 0) > 0.05 || (signal.replayDivergenceRate ?? 0) > 0.03, "partial-db-recovery");
  addIfActive(modes, Boolean(signal.regionalBackhaulDown), "regional-isolation");

  if (modes.size === 0) modes.add("normal");

  const activeModes = Array.from(modes);
  const allowedCapabilities = Array.from(
    new Set(activeModes.flatMap((mode) => CAPABILITIES[mode] ?? []))
  );

  return {
    activeModes,
    allowedCapabilities,
    severity: activeModes.includes("disaster-surge")
      ? "disaster"
      : activeModes.length >= 3
        ? "severe"
        : activeModes[0] === "normal"
          ? "normal"
          : "degraded"
  };
}

export function buildContainmentPlan(signal = {}) {
  const degradedState = evaluateDegradedModes(signal);
  const boundaries = [];

  if (degradedState.activeModes.includes("partial-db-recovery")) {
    boundaries.push({
      boundary: "replay-quarantine-zone",
      action: "isolate divergent queue segments and require authoritative timeline reconstruction"
    });
  }

  if (degradedState.activeModes.includes("operator-overload")) {
    boundaries.push({
      boundary: "operator-circuit-breaker",
      action: "suspend noncritical manual tasks and route immediate incidents to supervisor partition"
    });
  }

  if (degradedState.activeModes.includes("telecom-degraded")) {
    boundaries.push({
      boundary: "telecom-anomaly-isolation",
      action: "hold low-confidence receipts inside delayed consistency window before state transition"
    });
  }

  if (degradedState.activeModes.includes("low-trust")) {
    boundaries.push({
      boundary: "trust-risk-containment",
      action: "freeze high-risk responder changes and require supervisor approval for dispatch expansion"
    });
  }

  if (degradedState.activeModes.includes("responder-scarcity")) {
    boundaries.push({
      boundary: "responder-group-segmentation",
      action: "reserve scarce responders for critical incidents and shift lower-severity cases to institutional review"
    });
  }

  return {
    degradedState,
    boundaries
  };
}
