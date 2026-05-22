import { buildContainmentPlan, evaluateDegradedModes } from "./degraded-mode.js";

const MODE_EXIT_REQUIREMENTS = {
  "telecom-degraded": ["telecom-health-stable", "receipt-confidence-window-closed"],
  "sms-only": ["app-connectivity-restored", "sms-backlog-reconciled"],
  "low-trust": ["trust-anomaly-reviewed", "confidence-stabilized"],
  "operator-overload": ["operator-load-normal", "supervisor-acknowledged-recovery"],
  "responder-scarcity": ["responder-coverage-restored", "critical-queue-cleared"],
  "disaster-surge": ["incident-rate-stable", "cluster-review-complete", "institutional-capacity-confirmed"],
  "partial-db-recovery": ["replay-divergence-resolved", "canonical-timeline-checkpointed"],
  "regional-isolation": ["backhaul-restored", "regional-queue-reconciled"]
};

const MODE_STABILIZATION_WINDOWS_MINUTES = {
  "telecom-degraded": 30,
  "sms-only": 20,
  "low-trust": 60,
  "operator-overload": 30,
  "responder-scarcity": 45,
  "disaster-surge": 90,
  "partial-db-recovery": 45,
  "regional-isolation": 60
};

const EXIT_DEPENDENCY_ORDER = [
  "partial-db-recovery",
  "regional-isolation",
  "telecom-degraded",
  "sms-only",
  "low-trust",
  "operator-overload",
  "responder-scarcity",
  "disaster-surge"
];

function includesAll(values, required) {
  return required.every((item) => values.includes(item));
}

function applyExecutionControls(signal = {}) {
  const controls = signal.operationalControls ?? {};

  return {
    ...signal,
    telecomHealthScore: Math.min(1, (signal.telecomHealthScore ?? 1) + (controls.smsProviderFailover ? 0.24 : 0) + (controls.telecomHealthMonitor ? 0.08 : 0)),
    appConnectivityRate: Math.min(1, (signal.appConnectivityRate ?? 1) + (controls.edgeRetryRouting ? 0.28 : 0)),
    trustConfidenceScore: Math.min(1, (signal.trustConfidenceScore ?? 1) + (controls.trustContainmentReview ? 0.36 : 0)),
    operatorLoadPerOperator: Math.max(0, (signal.operatorLoadPerOperator ?? 0) * (controls.operatorAutoscaling ? 0.45 : 1) * (controls.operatorQueuePartitioning ? 0.75 : 1)),
    availableResponders: Math.round((signal.availableResponders ?? 1) * (controls.responderRegionalBalancing ? 3 : 1)),
    dbWriteFailureRate: Math.max(0, (signal.dbWriteFailureRate ?? 0) * (controls.replayReconciliation ? 0.15 : 1)),
    replayDivergenceRate: Math.max(0, (signal.replayDivergenceRate ?? 0) * (controls.replayReconciliation ? 0.12 : 1)),
    queueReplayRate: Math.max(0, (signal.queueReplayRate ?? 0) * (controls.queueReplayDrain ? 0.28 : 1)),
    unreconciledIncidentRate: Math.max(0, (signal.unreconciledIncidentRate ?? 0) * (controls.incidentMergeReview ? 0.25 : 1)),
    regionalBackhaulDown: controls.multiRegionBackhaul ? false : signal.regionalBackhaulDown
  };
}

export function analyzeEmergentFailures(signal = {}) {
  const effectiveSignal = applyExecutionControls(signal);
  const degradedState = evaluateDegradedModes(effectiveSignal);
  const modes = degradedState.activeModes;
  const risks = [];

  if (modes.includes("telecom-degraded") && modes.includes("operator-overload")) {
    risks.push({
      risk: "operator-confusion-amplification",
      severity: "high",
      reason: "Low-confidence telecom state increases manual review while operators are overloaded."
    });
  }

  if (modes.includes("regional-isolation") && modes.includes("low-trust")) {
    risks.push({
      risk: "trust-state-deadlock",
      severity: "critical",
      reason: "Local autonomy conflicts with trust freezes when governance review is unavailable."
    });
  }

  if (modes.includes("sms-only") && modes.includes("partial-db-recovery")) {
    risks.push({
      risk: "replay-divergence-propagation",
      severity: "critical",
      reason: "SMS-only intake can continue adding events while canonical timelines are under reconstruction."
    });
  }

  if (modes.includes("disaster-surge") && modes.includes("responder-scarcity")) {
    risks.push({
      risk: "scarcity-escalation-feedback-loop",
      severity: "critical",
      reason: "Responder scarcity can trigger repeated escalation without adding real response capacity."
    });
  }

  if ((effectiveSignal.queueReplayRate ?? 0) > 100 && (effectiveSignal.replayDivergenceRate ?? 0) > 0.02) {
    risks.push({
      risk: "synchronization-race-condition",
      severity: "high",
      reason: "High replay throughput with divergence suggests reconnect storm race conditions."
    });
  }

  return {
    degradedState,
    risks,
    systemStability: risks.some((risk) => risk.severity === "critical")
      ? "unstable"
      : risks.length > 0
        ? "fragile"
        : "stable"
  };
}

export function buildRecoveryPlan(currentSignal = {}, recoveryEvidence = {}) {
  const degradedState = evaluateDegradedModes(applyExecutionControls(currentSignal));
  const completedCheckpoints = recoveryEvidence.completedCheckpoints ?? [];
  const stabilizationWindows = recoveryEvidence.stabilizationWindows ?? {};
  const acknowledgments = recoveryEvidence.acknowledgments ?? {};
  const modePlans = degradedState.activeModes
    .filter((mode) => mode !== "normal")
    .map((mode) => {
      const requiredCheckpoints = MODE_EXIT_REQUIREMENTS[mode] ?? [];
      const requiredWindowMinutes = MODE_STABILIZATION_WINDOWS_MINUTES[mode] ?? 0;
      const observedWindowMinutes = stabilizationWindows[mode] ?? 0;
      const stabilizationWindowSatisfied = observedWindowMinutes >= requiredWindowMinutes;
      const humanAcknowledgmentRequired = ["low-trust", "operator-overload", "disaster-surge", "partial-db-recovery", "regional-isolation"].includes(mode);
      const humanAcknowledgmentSatisfied = !humanAcknowledgmentRequired || Boolean(acknowledgments[mode]);
      const checkpointsSatisfied = includesAll(completedCheckpoints, requiredCheckpoints);
      const canExit = checkpointsSatisfied && stabilizationWindowSatisfied && humanAcknowledgmentSatisfied;

      return {
        mode,
        requiredCheckpoints,
        completedCheckpoints: requiredCheckpoints.filter((checkpoint) => completedCheckpoints.includes(checkpoint)),
        requiredWindowMinutes,
        observedWindowMinutes,
        stabilizationWindowSatisfied,
        humanAcknowledgmentRequired,
        humanAcknowledgmentSatisfied,
        canExit
      };
    });

  const exitSequence = EXIT_DEPENDENCY_ORDER.filter((mode) => modePlans.some((plan) => plan.mode === mode && plan.canExit));

  return {
    modePlans,
    exitSequence,
    recoveryState: modePlans.length === 0
      ? "normal"
      : modePlans.every((plan) => plan.canExit)
        ? "ready-for-controlled-exit"
        : "hold-degraded-mode"
  };
}

export function scoreConvergenceConfidence(signal = {}, recoveryEvidence = {}, emergentRisks = []) {
  const effectiveSignal = applyExecutionControls(signal);
  const replayConfidence = Math.max(0, 1 - (effectiveSignal.replayDivergenceRate ?? 0) * 8 - (effectiveSignal.dbWriteFailureRate ?? 0) * 3);
  const telecomConfidence = Math.max(0, Math.min(1, effectiveSignal.telecomHealthScore ?? 1));
  const syncConfidence = Math.max(0, 1 - Math.max(0, (effectiveSignal.queueReplayRate ?? 0) - 50) / 200);
  const operatorConfidence = Math.max(0, 1 - Math.max(0, (effectiveSignal.operatorLoadPerOperator ?? 0) - 4) / 10);
  const trustConfidence = Math.max(0, Math.min(1, effectiveSignal.trustConfidenceScore ?? 1));
  const incidentReconciliationConfidence = Math.max(0, 1 - (effectiveSignal.unreconciledIncidentRate ?? 0) * 3);
  const criticalRiskPenalty = emergentRisks.filter((risk) => risk.severity === "critical").length * 0.18;
  const acknowledgmentCount = Object.values(recoveryEvidence.acknowledgments ?? {}).filter(Boolean).length;
  const acknowledgmentConfidence = Math.min(1, acknowledgmentCount / 3);

  const confidence =
    replayConfidence * 0.2 +
    telecomConfidence * 0.16 +
    syncConfidence * 0.14 +
    operatorConfidence * 0.14 +
    trustConfidence * 0.16 +
    incidentReconciliationConfidence * 0.12 +
    acknowledgmentConfidence * 0.08 -
    criticalRiskPenalty;

  const normalizedConfidence = Math.max(0, Math.min(1, confidence));

  return {
    score: Number(normalizedConfidence.toFixed(3)),
    band: normalizedConfidence >= 0.9 ? "ready" : normalizedConfidence >= 0.75 ? "cautious" : normalizedConfidence >= 0.55 ? "unstable" : "unsafe",
    components: {
      replayConfidence: Number(replayConfidence.toFixed(3)),
      telecomConfidence: Number(telecomConfidence.toFixed(3)),
      syncConfidence: Number(syncConfidence.toFixed(3)),
      operatorConfidence: Number(operatorConfidence.toFixed(3)),
      trustConfidence: Number(trustConfidence.toFixed(3)),
      incidentReconciliationConfidence: Number(incidentReconciliationConfidence.toFixed(3)),
      acknowledgmentConfidence: Number(acknowledgmentConfidence.toFixed(3))
    }
  };
}

export function decideRecoveryAction(convergenceResult) {
  const confidence = convergenceResult.convergenceConfidence;
  const hasCriticalRisks = convergenceResult.convergence.unresolvedCriticalRisks > 0;
  const recoveryReady = ["normal", "ready-for-controlled-exit"].includes(convergenceResult.recovery.recoveryState);

  if (hasCriticalRisks || confidence.band === "unsafe") {
    return {
      action: "rollback-to-degraded-mode",
      reason: "Critical emergent risks or unsafe convergence confidence remain active."
    };
  }

  if (!recoveryReady || confidence.band === "unstable") {
    return {
      action: "hold-and-stabilize",
      reason: "Recovery evidence, stabilization windows, or confidence levels are insufficient."
    };
  }

  if (confidence.band === "cautious") {
    return {
      action: "staged-exit-with-supervisor-watch",
      reason: "Recovery can proceed only through ordered exit with supervisor monitoring."
    };
  }

  return {
    action: "controlled-exit",
    reason: "Recovery checkpoints, stabilization windows, acknowledgments, and confidence are sufficient."
  };
}

export function evaluateConvergenceScenario(scenario) {
  const containment = buildContainmentPlan(scenario.signal);
  const emergent = analyzeEmergentFailures(scenario.signal);
  const recovery = buildRecoveryPlan(scenario.signal, scenario.recoveryEvidence);
  const convergenceConfidence = scoreConvergenceConfidence(scenario.signal, scenario.recoveryEvidence, emergent.risks);
  const unresolvedCriticalRisks = emergent.risks.filter((risk) => risk.severity === "critical").length;
  const containmentCoverage = emergent.risks.length === 0
    ? 1
    : Math.min(1, containment.boundaries.length / emergent.risks.length);
  const result = {
    id: scenario.id,
    name: scenario.name,
    degradedState: emergent.degradedState,
    containmentBoundaries: containment.boundaries,
    emergentRisks: emergent.risks,
    recovery,
    convergenceConfidence,
    convergence: {
      stable: emergent.systemStability === "stable" && recovery.recoveryState !== "hold-degraded-mode" && convergenceConfidence.band === "ready",
      systemStability: emergent.systemStability,
      containmentCoverage: Number(containmentCoverage.toFixed(3)),
      unresolvedCriticalRisks
    }
  };
  return {
    ...result,
    recoveryAction: decideRecoveryAction(result)
  };
}

export function buildTelemetrySnapshot(convergenceResult) {
  return {
    scenarioId: convergenceResult.id,
    activeModes: convergenceResult.degradedState.activeModes,
    severity: convergenceResult.degradedState.severity,
    systemStability: convergenceResult.convergence.systemStability,
    unresolvedCriticalRisks: convergenceResult.convergence.unresolvedCriticalRisks,
    containmentBoundaryCount: convergenceResult.containmentBoundaries.length,
    recoveryState: convergenceResult.recovery.recoveryState,
    exitSequence: convergenceResult.recovery.exitSequence,
    convergenceConfidence: convergenceResult.convergenceConfidence.score,
    convergenceConfidenceBand: convergenceResult.convergenceConfidence.band,
    recoveryAction: convergenceResult.recoveryAction.action
  };
}
