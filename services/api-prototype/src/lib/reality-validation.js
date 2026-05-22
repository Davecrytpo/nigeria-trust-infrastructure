function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

export function evaluateExperimentApproval(experiment = {}) {
  const blockers = [];
  const maxParticipants = experiment.maxParticipants ?? 0;
  const durationHours = experiment.durationHours ?? 0;
  const categories = experiment.incidentCategories ?? [];
  const highRiskCategories = ["kidnap", "violent-crime", "major-medical", "fire-inside-building", "domestic-violence"];

  if (!experiment.supervisorAssigned) blockers.push("supervisor-not-assigned");
  if (!experiment.rollbackAuthorityAssigned) blockers.push("rollback-authority-not-assigned");
  if (!experiment.auditTrailEnabled) blockers.push("experiment-audit-trail-not-enabled");
  if (!experiment.participantConsentRecorded) blockers.push("participant-consent-not-recorded");
  if (maxParticipants > 50) blockers.push("participant-exposure-too-large");
  if (durationHours > 4) blockers.push("experiment-duration-too-long");
  if (categories.some((category) => highRiskCategories.includes(category))) blockers.push("high-risk-category-not-allowed-in-experiment");
  if ((experiment.liveDispatchEnabled ?? false) && !experiment.manualApprovalRequired) blockers.push("live-dispatch-without-manual-approval");

  return {
    approvalState: blockers.length === 0 ? "approved-controlled-experiment" : blockers.length <= 2 ? "revise-before-experiment" : "rejected",
    blockers,
    allowedMode: blockers.length === 0 ? "supervised-live-observation" : blockers.length <= 2 ? "shadow-only" : "do-not-run"
  };
}

export function compareObservedToAssumptions(assumptions = {}, observed = {}) {
  const divergence = {
    smsLatency: clamp(((observed.p95SmsLatencySeconds ?? 0) - (assumptions.p95SmsLatencySeconds ?? 0)) / 480),
    responderAck: clamp(((observed.p95ResponderAckSeconds ?? 0) - (assumptions.p95ResponderAckSeconds ?? 0)) / 600),
    operatorDecision: clamp(((observed.p95OperatorDecisionSeconds ?? 0) - (assumptions.p95OperatorDecisionSeconds ?? 0)) / 600),
    gpsDrift: clamp(((observed.p95GpsDriftMeters ?? 0) - (assumptions.p95GpsDriftMeters ?? 0)) / 250),
    batteryFailure: clamp((observed.lowBatteryFailureRate ?? 0) - (assumptions.lowBatteryFailureRate ?? 0)),
    syncDivergence: clamp((observed.syncDivergenceRate ?? 0) - (assumptions.syncDivergenceRate ?? 0)),
    institutionalNonResponse: clamp((observed.institutionalNonResponseRate ?? 0) - (assumptions.institutionalNonResponseRate ?? 0))
  };
  const maxDivergence = Math.max(...Object.values(divergence));
  const averageDivergence = Object.values(divergence).reduce((sum, value) => sum + value, 0) / Object.values(divergence).length;

  return {
    divergence,
    maxDivergence: Number(maxDivergence.toFixed(3)),
    averageDivergence: Number(averageDivergence.toFixed(3)),
    divergenceBand: maxDivergence >= 0.6 ? "severe" : maxDivergence >= 0.35 ? "material" : maxDivergence >= 0.15 ? "watch" : "minor",
    requiredAction:
      maxDivergence >= 0.6
        ? "pause-and-recalibrate-assumptions"
        : maxDivergence >= 0.35
          ? "restrict-and-investigate"
          : maxDivergence >= 0.15
            ? "continue-with-heightened-observation"
            : "continue-observation"
  };
}

export function evaluateHumanChaos(observed = {}) {
  const confusion = clamp(observed.confusionUnderStressRate ?? 0);
  const inconsistentEscalation = clamp(observed.inconsistentEscalationRate ?? 0);
  const panicMisuse = clamp(observed.panicMisuseRate ?? 0);
  const fatigue = clamp(observed.fatigueDegradationRate ?? 0);
  const supervisionDependence = clamp(observed.supervisionDependenceRate ?? 0);
  const emotionalOverload = clamp(observed.emotionalOverloadRate ?? 0);
  const delayedComprehension = clamp(observed.delayedSituationalComprehensionRate ?? 0);
  const chaosScore = clamp(
    confusion * 0.16 +
    inconsistentEscalation * 0.16 +
    panicMisuse * 0.12 +
    fatigue * 0.16 +
    supervisionDependence * 0.14 +
    emotionalOverload * 0.12 +
    delayedComprehension * 0.14
  );

  return {
    chaosScore: Number(chaosScore.toFixed(3)),
    chaosBand: chaosScore >= 0.7 ? "severe" : chaosScore >= 0.45 ? "high" : chaosScore >= 0.25 ? "watch" : "contained",
    requiredAction:
      chaosScore >= 0.7
        ? "pause-human-dependent-experiment"
        : chaosScore >= 0.45
          ? "increase-supervision-and-reduce-scope"
          : chaosScore >= 0.25
            ? "continue-with-human-factors-observer"
            : "continue-observation"
  };
}

export function evaluateOperationalFatigue(observed = {}) {
  const operatorDecay = clamp(observed.operatorPerformanceDecayRate ?? 0);
  const responderDecay = clamp(observed.responderReliabilityDecayRate ?? 0);
  const supervisorAccumulation = clamp(observed.supervisionOverloadAccumulation ?? 0);
  const degradedNormalization = clamp(observed.degradedModeNormalizationRisk ?? 0);
  const alertFatigue = clamp(observed.alertFatigueRate ?? 0);
  const governanceFatigue = clamp(observed.governanceReviewFatigueRate ?? 0);
  const fatigueScore = clamp(
    operatorDecay * 0.18 +
    responderDecay * 0.16 +
    supervisorAccumulation * 0.16 +
    degradedNormalization * 0.18 +
    alertFatigue * 0.16 +
    governanceFatigue * 0.16
  );

  return {
    fatigueScore: Number(fatigueScore.toFixed(3)),
    fatigueBand: fatigueScore >= 0.7 ? "severe" : fatigueScore >= 0.45 ? "high" : fatigueScore >= 0.25 ? "watch" : "contained",
    requiredAction:
      fatigueScore >= 0.7
        ? "stop-experiment-and-rest"
        : fatigueScore >= 0.45
          ? "shorten-window-and-add-supervisor"
          : fatigueScore >= 0.25
            ? "rotate-staff-and-observe"
            : "continue"
  };
}

export function detectFalseConfidence(signal = {}) {
  const indicators = [];

  if ((signal.recoveryConfidence ?? 0) > 0.8 && (signal.postRecoveryVerificationRate ?? 0) < 0.9) indicators.push("misleading-recovery-confidence");
  if ((signal.replayCertaintyScore ?? 0) > 0.8 && (signal.hiddenReplayConflictRate ?? 0) > 0.01) indicators.push("replay-certainty-inflation");
  if ((signal.degradedModeActiveMinutes ?? 0) > 30 && (signal.dashboardShowsNormal ?? false)) indicators.push("hidden-degraded-persistence");
  if ((signal.operatorConfusionReports ?? 0) > 0 && (signal.operatorClarityScore ?? 1) > 0.8) indicators.push("unnoticed-operator-confusion");
  if ((signal.syncDriftDetected ?? 0) > (signal.syncDriftDisplayed ?? 0)) indicators.push("silent-synchronization-drift");
  if ((signal.governanceReviewSkippedCount ?? 0) > 0 && (signal.governanceHealthScore ?? 1) > 0.8) indicators.push("governance-complacency");

  return {
    indicators,
    falseConfidenceBand: indicators.length === 0 ? "none" : indicators.length <= 2 ? "watch" : indicators.length <= 4 ? "serious" : "critical",
    requiredAction:
      indicators.length === 0
        ? "continue"
        : indicators.length <= 2
          ? "verify-before-normalization"
          : indicators.length <= 4
            ? "hold-degraded-and-investigate"
            : "pause-and-reset-confidence"
  };
}

export function recommendRealityExperimentDecision(input = {}) {
  const approval = evaluateExperimentApproval(input.experiment);
  const divergence = compareObservedToAssumptions(input.assumptions, input.observed);
  const humanChaos = evaluateHumanChaos(input.human);
  const fatigue = evaluateOperationalFatigue(input.fatigue);
  const falseConfidence = detectFalseConfidence(input.falseConfidence);

  if (approval.allowedMode === "do-not-run" || humanChaos.requiredAction === "pause-human-dependent-experiment" || fatigue.requiredAction === "stop-experiment-and-rest" || falseConfidence.requiredAction === "pause-and-reset-confidence") {
    return { decision: "do-not-run-or-stop-experiment", approval, divergence, humanChaos, fatigue, falseConfidence };
  }

  if (divergence.requiredAction === "pause-and-recalibrate-assumptions" || falseConfidence.requiredAction === "hold-degraded-and-investigate") {
    return { decision: "pause-and-investigate-reality-gap", approval, divergence, humanChaos, fatigue, falseConfidence };
  }

  if (approval.allowedMode === "shadow-only" || divergence.requiredAction === "restrict-and-investigate" || humanChaos.requiredAction === "increase-supervision-and-reduce-scope" || fatigue.requiredAction === "shorten-window-and-add-supervisor") {
    return { decision: "restricted-shadow-or-supervised-experiment", approval, divergence, humanChaos, fatigue, falseConfidence };
  }

  return { decision: "run-controlled-reality-experiment", approval, divergence, humanChaos, fatigue, falseConfidence };
}
