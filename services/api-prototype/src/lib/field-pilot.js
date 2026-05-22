function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

export function evaluatePilotScope(scope = {}) {
  const blockers = [];
  const residentCount = scope.residentCount ?? 0;
  const responderCount = scope.responderCount ?? 0;
  const operatorCount = scope.operatorCount ?? 0;
  const dailyHours = scope.dailyOperationalHours ?? 0;
  const incidentCategories = scope.permittedIncidentCategories ?? [];
  const highRiskCategories = ["kidnap", "violent-crime", "fire-inside-building", "major-medical", "domestic-violence"];

  if (residentCount > 300) blockers.push("resident-count-exceeds-controlled-pilot-limit");
  if (responderCount > 25) blockers.push("responder-count-exceeds-supervision-limit");
  if (operatorCount < 2) blockers.push("insufficient-operator-coverage");
  if (dailyHours > 8) blockers.push("pilot-hours-exceed-fatigue-safe-window");
  if (incidentCategories.some((category) => highRiskCategories.includes(category))) blockers.push("high-risk-category-not-permitted-without-supervisor-only-flow");
  if (!scope.singleNeighborhood) blockers.push("pilot-scope-not-limited-to-single-neighborhood");

  return {
    scopeBand: blockers.length === 0 ? "controlled" : blockers.length <= 2 ? "overbroad" : "unsafe",
    blockers,
    permittedMode: blockers.length === 0 ? "limited-live-validation" : blockers.length <= 2 ? "shadow-or-dry-run" : "do-not-run"
  };
}

export function evaluateHumanFieldPreparation(prep = {}) {
  const responder = clamp(prep.responderOnboardingCompletion ?? 0);
  const operator = clamp(prep.operatorTrainingCompletion ?? 0);
  const supervisor = clamp(prep.supervisorReviewReadiness ?? 0);
  const escalation = clamp(prep.escalationCommsDrillCompletion ?? 0);
  const degraded = clamp(prep.degradedModeTrainingCompletion ?? 0);
  const telecom = clamp(prep.telecomFailureDrillCompletion ?? 0);
  const incidentReview = clamp(prep.incidentReviewWorkflowReadiness ?? 0);
  const score = clamp(
    responder * 0.16 +
    operator * 0.18 +
    supervisor * 0.15 +
    escalation * 0.14 +
    degraded * 0.14 +
    telecom * 0.12 +
    incidentReview * 0.11
  );

  return {
    preparationScore: Number(score.toFixed(3)),
    preparationBand: score >= 0.86 ? "field-ready" : score >= 0.7 ? "limited" : score >= 0.5 ? "immature" : "unsafe",
    requiredAction:
      score >= 0.86
        ? "maintain-drills"
        : score >= 0.7
          ? "limited-supervised-hours"
          : score >= 0.5
            ? "dry-runs-only"
            : "do-not-run"
  };
}

export function evaluateLiveObservability(readiness = {}) {
  const degraded = clamp(readiness.degradedStateVisibility ?? 0);
  const cognitive = clamp(readiness.operatorCognitiveLoadVisibility ?? 0);
  const telecom = clamp(readiness.telecomInstabilityVisibility ?? 0);
  const replay = clamp(readiness.replayDivergenceVisibility ?? 0);
  const trust = clamp(readiness.trustVolatilityVisibility ?? 0);
  const institutional = clamp(readiness.institutionalNonResponseVisibility ?? 0);
  const escalation = clamp(readiness.escalationBottleneckVisibility ?? 0);
  const convergence = clamp(readiness.recoveryConvergenceVisibility ?? 0);
  const score = clamp(
    degraded * 0.14 +
    cognitive * 0.13 +
    telecom * 0.13 +
    replay * 0.13 +
    trust * 0.12 +
    institutional * 0.12 +
    escalation * 0.11 +
    convergence * 0.12
  );

  return {
    observabilityScore: Number(score.toFixed(3)),
    observabilityBand: score >= 0.86 ? "live-observable" : score >= 0.7 ? "limited" : score >= 0.5 ? "weak" : "blind",
    requiredAction:
      score >= 0.86
        ? "operate-with-live-watch"
        : score >= 0.7
          ? "limited-hours-with-manual-watch"
          : score >= 0.5
            ? "shadow-mode-only"
            : "do-not-run"
  };
}

export function evaluateFieldSafetyConstraints(signal = {}) {
  const restrictions = [];

  if ((signal.trustConfidenceScore ?? 1) < 0.75) restrictions.push("supervisor-only-dispatch");
  if ((signal.operatorLoadPerOperator ?? 0) > 5) restrictions.push("pilot-slowdown");
  if ((signal.telecomHealthScore ?? 1) < 0.7) restrictions.push("sms-confidence-window-required");
  if ((signal.replayDivergenceRate ?? 0) > 0.01) restrictions.push("manual-review-before-resolution");
  if ((signal.institutionalAcknowledgmentRate ?? 1) < 0.65) restrictions.push("institutional-confirmation-required");
  if ((signal.activeDegradedModes ?? 0) > 0) restrictions.push("automatic-degraded-mode-restriction");
  if ((signal.lifeSafetyHighRiskRate ?? 0) > 0.2) restrictions.push("high-risk-incidents-supervisor-only");

  return {
    restrictions,
    safetyBand: restrictions.length === 0 ? "normal-limited" : restrictions.length <= 3 ? "restricted" : "pause-required",
    requiredAction:
      restrictions.length === 0
        ? "continue-limited-pilot"
        : restrictions.length <= 3
          ? "continue-with-restrictions"
          : "pause-live-pilot"
  };
}

export function evaluateTelecomFieldValidation(validation = {}) {
  const smsLatency = clamp(1 - Math.max(0, (validation.p95SmsLatencySeconds ?? 999) - 120) / 480);
  const deliveryConfidence = clamp(validation.deliveryReceiptConfidence ?? 0);
  const providerConsistency = clamp(validation.providerConsistencyScore ?? 0);
  const lowBattery = clamp(validation.lowBatteryDeliveryReliability ?? 0);
  const androidBackground = clamp(validation.androidBackgroundReliability ?? 0);
  const offlineRecovery = clamp(validation.prolongedOfflineRecoveryRate ?? 0);
  const score = clamp(
    smsLatency * 0.16 +
    deliveryConfidence * 0.17 +
    providerConsistency * 0.15 +
    lowBattery * 0.16 +
    androidBackground * 0.18 +
    offlineRecovery * 0.18
  );

  return {
    telecomValidationScore: Number(score.toFixed(3)),
    telecomValidationBand: score >= 0.86 ? "validated" : score >= 0.7 ? "limited" : score >= 0.5 ? "fragile" : "unsafe",
    requiredAction:
      score >= 0.86
        ? "continue-field-measurement"
        : score >= 0.7
          ? "limit-telecom-dependent-flows"
          : score >= 0.5
            ? "sms-shadow-validation-only"
            : "do-not-run-live-telecom-flow"
  };
}

export function recommendLimitedPilotDecision(input = {}) {
  const scope = evaluatePilotScope(input.scope);
  const human = evaluateHumanFieldPreparation(input.human);
  const observability = evaluateLiveObservability(input.observability);
  const safety = evaluateFieldSafetyConstraints(input.safety);
  const telecom = evaluateTelecomFieldValidation(input.telecom);
  const governanceDecision = input.governanceDecision ?? "do-not-deploy-remediate-governance";

  if (scope.permittedMode === "do-not-run" || human.requiredAction === "do-not-run" || observability.requiredAction === "do-not-run" || telecom.requiredAction === "do-not-run-live-telecom-flow") {
    return { decision: "do-not-run-field-pilot", scope, human, observability, safety, telecom };
  }

  if (safety.requiredAction === "pause-live-pilot" || governanceDecision === "emergency-freeze") {
    return { decision: "pause-or-freeze-pilot", scope, human, observability, safety, telecom };
  }

  if (governanceDecision === "approve-controlled-pilot" && scope.permittedMode === "limited-live-validation" && human.preparationBand === "field-ready" && observability.observabilityBand === "live-observable" && telecom.telecomValidationBand !== "unsafe" && safety.safetyBand !== "pause-required") {
    return { decision: "run-limited-supervised-pilot", scope, human, observability, safety, telecom };
  }

  if (governanceDecision === "limited-supervised-pilot-only" || scope.permittedMode === "shadow-or-dry-run" || human.requiredAction === "limited-supervised-hours" || observability.requiredAction === "limited-hours-with-manual-watch") {
    return { decision: "limited-hours-or-shadow-mode", scope, human, observability, safety, telecom };
  }

  return { decision: "dry-runs-only", scope, human, observability, safety, telecom };
}
