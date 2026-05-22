function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

export function evaluateObservedFieldTruth(observed = {}) {
  const sms = clamp(1 - Math.max(0, (observed.p95SmsLatencySeconds ?? 999) - 120) / 480);
  const android = clamp(1 - (observed.androidBackgroundFailureRate ?? 1));
  const battery = clamp(observed.lowBatterySurvivalRate ?? 0);
  const gps = clamp(1 - Math.max(0, (observed.p95GpsDriftMeters ?? 999) - 50) / 250);
  const responder = clamp(1 - Math.max(0, (observed.p95ResponderAckSeconds ?? 999) - 180) / 600);
  const operator = clamp(1 - (observed.operatorSaturationRate ?? 1));
  const institutional = clamp(observed.institutionalResponseConsistency ?? 0);
  const score = clamp(
    sms * 0.14 +
    android * 0.16 +
    battery * 0.14 +
    gps * 0.1 +
    responder * 0.14 +
    operator * 0.16 +
    institutional * 0.16
  );

  return {
    fieldTruthScore: Number(score.toFixed(3)),
    fieldTruthBand: score >= 0.86 ? "validated" : score >= 0.7 ? "limited" : score >= 0.5 ? "fragile" : "unproven",
    overridesSimulation: score < 0.86,
    components: {
      sms: Number(sms.toFixed(3)),
      android: Number(android.toFixed(3)),
      battery: Number(battery.toFixed(3)),
      gps: Number(gps.toFixed(3)),
      responder: Number(responder.toFixed(3)),
      operator: Number(operator.toFixed(3)),
      institutional: Number(institutional.toFixed(3))
    }
  };
}

export function discoverOperationalBlindSpots(signal = {}) {
  const blindSpots = [];

  if ((signal.syncDivergenceDetected ?? 0) > (signal.syncDivergenceVisible ?? 0)) blindSpots.push("silent-synchronization-divergence");
  if ((signal.replayConflictRate ?? 0) > 0.01 && (signal.replayConflictVisibility ?? 0) < 0.8) blindSpots.push("hidden-replay-inconsistency");
  if ((signal.confidenceNormalizationEvents ?? 0) > 0 && (signal.postRecoveryVerificationRate ?? 0) < 0.9) blindSpots.push("false-confidence-normalization");
  if ((signal.degradedModeMinutes ?? 0) > 30 && (signal.degradedModeOperatorAwareness ?? 0) < 0.85) blindSpots.push("unnoticed-degraded-persistence");
  if ((signal.escalationTimingVarianceSeconds ?? 0) > 180) blindSpots.push("escalation-timing-ambiguity");
  if ((signal.operatorMisunderstandingReports ?? 0) > 0) blindSpots.push("operator-understanding-chain-risk");
  if ((signal.telecomPartialFailureDetected ?? 0) > (signal.telecomPartialFailureVisible ?? 0)) blindSpots.push("telecom-partial-failure-invisibility");

  return {
    blindSpots,
    blindSpotBand: blindSpots.length === 0 ? "clear" : blindSpots.length <= 2 ? "watch" : blindSpots.length <= 4 ? "serious" : "critical",
    requiredAction:
      blindSpots.length === 0
        ? "continue-validation"
        : blindSpots.length <= 2
          ? "instrument-and-review"
          : blindSpots.length <= 4
            ? "restrict-field-operations"
            : "pause-and-investigate"
  };
}

export function evaluateHumanFactorValidation(observed = {}) {
  const responderHesitation = clamp(1 - (observed.responderHesitationRate ?? 1));
  const operatorOverload = clamp(1 - (observed.operatorOverloadReactionFailureRate ?? 1));
  const panicMisuse = clamp(1 - (observed.panicMisuseRate ?? 1));
  const escalationDiscipline = clamp(observed.escalationDisciplineScore ?? 0);
  const fatigue = clamp(1 - (observed.fatigueMistakeRate ?? 1));
  const supervision = clamp(observed.supervisionEffectivenessScore ?? 0);
  const uncertaintyComms = clamp(observed.uncertaintyCommunicationQuality ?? 0);
  const score = clamp(
    responderHesitation * 0.14 +
    operatorOverload * 0.16 +
    panicMisuse * 0.12 +
    escalationDiscipline * 0.16 +
    fatigue * 0.14 +
    supervision * 0.16 +
    uncertaintyComms * 0.12
  );

  return {
    humanValidationScore: Number(score.toFixed(3)),
    humanValidationBand: score >= 0.86 ? "validated" : score >= 0.7 ? "limited" : score >= 0.5 ? "fragile" : "unsafe",
    requiredAction:
      score >= 0.86
        ? "continue-field-observation"
        : score >= 0.7
          ? "increase-supervision"
          : score >= 0.5
            ? "dry-runs-and-retraining"
            : "pause-human-dependent-flows"
  };
}

export function evaluateGovernanceDurability(observed = {}) {
  const review = clamp(observed.reviewDisciplineScore ?? 0);
  const fatigue = clamp(1 - (observed.governanceFatigueRate ?? 1));
  const policy = clamp(1 - (observed.policyDriftRate ?? 1));
  const oversight = clamp(1 - (observed.oversightErosionRate ?? 1));
  const supervisor = clamp(1 - (observed.supervisorOverloadRate ?? 1));
  const institutional = clamp(1 - (observed.institutionalCoordinationBreakdownRate ?? 1));
  const score = clamp(review * 0.2 + fatigue * 0.16 + policy * 0.16 + oversight * 0.16 + supervisor * 0.16 + institutional * 0.16);

  return {
    governanceDurabilityScore: Number(score.toFixed(3)),
    governanceDurabilityBand: score >= 0.86 ? "durable" : score >= 0.7 ? "strained" : score >= 0.5 ? "fragile" : "failing",
    requiredAction:
      score >= 0.86
        ? "maintain-governance-cadence"
        : score >= 0.7
          ? "increase-board-review"
          : score >= 0.5
            ? "restrict-pilot-and-reinforce-governance"
            : "freeze-pilot-governance-failure"
  };
}

export function determineCertificationState(input = {}) {
  const fieldTruth = evaluateObservedFieldTruth(input.fieldTruth);
  const blindSpots = discoverOperationalBlindSpots(input.blindSpots);
  const human = evaluateHumanFactorValidation(input.human);
  const governance = evaluateGovernanceDurability(input.governance);
  const readinessGates = input.readinessGates ?? {};
  const allHardGatesPassed = Boolean(readinessGates.field && readinessGates.stress && readinessGates.convergence);

  let certificationState = "not-certified";
  if (allHardGatesPassed && fieldTruth.fieldTruthBand === "validated" && blindSpots.blindSpotBand === "clear" && human.humanValidationBand === "validated" && governance.governanceDurabilityBand === "durable") {
    certificationState = "limited-operational-certification";
  } else if (fieldTruth.fieldTruthBand !== "unproven" && blindSpots.blindSpotBand !== "critical" && human.humanValidationBand !== "unsafe" && governance.governanceDurabilityBand !== "failing") {
    certificationState = "restricted-supervised-validation";
  }

  return {
    certificationState,
    fieldTruth,
    blindSpots,
    human,
    governance,
    restrictions: [
      ...(!readinessGates.field ? ["field-readiness-gate-not-passed"] : []),
      ...(!readinessGates.stress ? ["stress-gate-not-passed"] : []),
      ...(!readinessGates.convergence ? ["convergence-gate-not-passed"] : []),
      ...(fieldTruth.overridesSimulation ? ["observed-field-truth-overrides-simulation"] : []),
      ...(blindSpots.blindSpots.length > 0 ? ["blind-spots-require-investigation"] : [])
    ]
  };
}
