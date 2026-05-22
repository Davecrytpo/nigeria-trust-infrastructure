function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

const LOW_RISK_CATEGORIES = new Set([
  "welfare-check",
  "low-severity-medical",
  "neighborhood-coordination",
  "blackout-coordination",
  "flood-awareness",
  "non-violent-reporting"
]);

const HIGH_AUTHORITY_CATEGORIES = new Set([
  "armed-robbery",
  "kidnapping",
  "violent-confrontation",
  "high-authority-intervention",
  "domestic-violence",
  "major-medical",
  "fire-inside-building"
]);

export function evaluateLivePilotScope(scope = {}) {
  const blockers = [];
  const warnings = [];
  const categories = scope.permittedIncidentCategories ?? [];

  if (!scope.singleNeighborhood) blockers.push("pilot-must-remain-single-neighborhood");
  if ((scope.residentCount ?? 0) > 150) blockers.push("resident-exposure-exceeds-live-learning-limit");
  if ((scope.responderCount ?? 0) > 12) blockers.push("responder-count-exceeds-live-supervision-limit");
  if ((scope.operatorCount ?? 0) < 2) blockers.push("insufficient-live-operator-coverage");
  if ((scope.supervisorCount ?? 0) < 1) blockers.push("supervisor-required-for-live-operation");
  if ((scope.dailyOperationalHours ?? 0) > 4) blockers.push("live-window-exceeds-fatigue-safe-limit");
  if (!scope.shutdownAuthorityAssigned) blockers.push("shutdown-authority-not-assigned");
  if (!scope.auditTrailMandatory) blockers.push("mandatory-audit-trail-not-enabled");
  if (!scope.rollbackPlanTested) blockers.push("rollback-plan-not-tested");

  const highAuthorityCategories = categories.filter((category) => HIGH_AUTHORITY_CATEGORIES.has(category));
  const unsupportedCategories = categories.filter((category) => !LOW_RISK_CATEGORIES.has(category) && !HIGH_AUTHORITY_CATEGORIES.has(category));
  if (highAuthorityCategories.length) blockers.push("high-authority-categories-not-earned");
  if (unsupportedCategories.length) warnings.push("category-requires-review-before-live-use");

  return {
    scopeBand: blockers.length === 0 ? "live-learning-controlled" : blockers.length <= 2 ? "restricted-shadow-only" : "unsafe-live-scope",
    blockers,
    warnings,
    allowedMode: blockers.length === 0 ? "limited-live-low-risk" : blockers.length <= 2 ? "shadow-or-tabletop-only" : "do-not-operationalize"
  };
}

export function scoreLiveTelecomObservation(observation = {}) {
  const smsDistribution = clamp(1 - Math.max(0, (observation.p95SmsLatencySeconds ?? 999) - 180) / 600);
  const providerAsymmetry = clamp(observation.providerAsymmetryScore ?? 0);
  const androidOemVariance = clamp(observation.androidOemInconsistencyRate ?? 0);
  const offlineRestoration = clamp(observation.offlineSyncRestorationRate ?? 0);
  const batteryImpact = clamp(observation.lowBatteryDeliveryFailureRate ?? 0);
  const oscillation = clamp(observation.networkOscillationRate ?? 0);
  const observationCompleteness = clamp(observation.telecomSampleCompleteness ?? 0);
  const riskScore = clamp(
    (1 - smsDistribution) * 0.18 +
    providerAsymmetry * 0.16 +
    androidOemVariance * 0.16 +
    (1 - offlineRestoration) * 0.18 +
    batteryImpact * 0.16 +
    oscillation * 0.1 +
    (1 - observationCompleteness) * 0.06
  );

  return {
    telecomRealityRisk: Number(riskScore.toFixed(3)),
    telecomRealityBand: riskScore >= 0.65 ? "unsafe" : riskScore >= 0.4 ? "fragile" : riskScore >= 0.2 ? "limited" : "observable",
    requiredAction:
      riskScore >= 0.65
        ? "pause-live-telecom-dependence"
        : riskScore >= 0.4
          ? "manual-telecom-review-only"
          : riskScore >= 0.2
            ? "continue-telecom-observation-with-limits"
            : "continue-telecom-truth-collection"
  };
}

export function scoreHumanOperationalBehavior(observation = {}) {
  const operatorHesitation = clamp(observation.operatorHesitationRate ?? 0);
  const responderConfusion = clamp(observation.responderConfusionRate ?? 0);
  const escalationInconsistency = clamp(observation.escalationInconsistencyRate ?? 0);
  const panicMisuse = clamp(observation.panicMisuseRate ?? 0);
  const fatigue = clamp(observation.fatigueAccumulationRate ?? 0);
  const abandonment = clamp(observation.responderAbandonmentRate ?? 0);
  const interpretationDrift = clamp(observation.alertInterpretationDriftRate ?? 0);
  const humanRisk = clamp(
    operatorHesitation * 0.16 +
    responderConfusion * 0.16 +
    escalationInconsistency * 0.16 +
    panicMisuse * 0.12 +
    fatigue * 0.16 +
    abandonment * 0.14 +
    interpretationDrift * 0.1
  );

  return {
    humanRiskScore: Number(humanRisk.toFixed(3)),
    humanRiskBand: humanRisk >= 0.65 ? "unsafe" : humanRisk >= 0.4 ? "unstable" : humanRisk >= 0.2 ? "watch" : "contained",
    requiredAction:
      humanRisk >= 0.65
        ? "pause-human-dependent-live-flow"
        : humanRisk >= 0.4
          ? "reduce-scope-and-increase-supervision"
          : humanRisk >= 0.2
            ? "continue-with-human-factors-observer"
            : "continue-observation"
  };
}

export function scoreGovernanceFriction(observation = {}) {
  const institutionalDelay = clamp((observation.p95InstitutionalDelayMinutes ?? 0) / 90);
  const approvalBottleneck = clamp(observation.approvalBottleneckRate ?? 0);
  const authorityAmbiguity = clamp(observation.authorityAmbiguityRate ?? 0);
  const supervisorDisagreement = clamp(observation.supervisorDisagreementRate ?? 0);
  const escalationDispute = clamp(observation.escalationDisputeRate ?? 0);
  const accountabilityFriction = clamp(observation.accountabilityFrictionRate ?? 0);
  const governanceRisk = clamp(
    institutionalDelay * 0.18 +
    approvalBottleneck * 0.16 +
    authorityAmbiguity * 0.18 +
    supervisorDisagreement * 0.16 +
    escalationDispute * 0.16 +
    accountabilityFriction * 0.16
  );

  return {
    governanceFrictionScore: Number(governanceRisk.toFixed(3)),
    governanceFrictionBand: governanceRisk >= 0.65 ? "blocking" : governanceRisk >= 0.4 ? "high" : governanceRisk >= 0.2 ? "watch" : "contained",
    requiredAction:
      governanceRisk >= 0.65
        ? "pause-live-pilot-for-governance-review"
        : governanceRisk >= 0.4
          ? "restrict-escalation-and-review-authority"
          : governanceRisk >= 0.2
            ? "increase-governance-observation"
            : "continue-governed-operation"
  };
}

export function evaluateIncidentReviewCompleteness(review = {}) {
  const required = ["replay", "governance", "responder", "telecom", "confusion", "modelDivergence", "uncertainty"];
  const completed = required.filter((key) => review[`${key}ReviewCompleted`] === true);
  const completeness = completed.length / required.length;

  return {
    completed,
    missing: required.filter((key) => !completed.includes(key)),
    completenessScore: Number(completeness.toFixed(3)),
    reviewBand: completeness === 1 ? "complete" : completeness >= 0.7 ? "incomplete-supervisor-required" : "unsafe-learning-record",
    requiredAction:
      completeness === 1
        ? "incident-may-enter-learning-record"
        : completeness >= 0.7
          ? "supervisor-review-before-learning-use"
          : "do-not-use-as-operational-truth"
  };
}

export function recommendLiveOperationalizationDecision(input = {}) {
  const scope = evaluateLivePilotScope(input.scope);
  const telecom = scoreLiveTelecomObservation(input.telecom);
  const human = scoreHumanOperationalBehavior(input.human);
  const governance = scoreGovernanceFriction(input.governance);
  const reviews = (input.incidentReviews ?? []).map(evaluateIncidentReviewCompleteness);
  const readinessGates = input.readinessGates ?? {};
  const failedReadinessGates = Object.entries(readinessGates).filter(([, passed]) => passed === false).map(([key]) => `${key}-gate-failed`);
  const reviewCompleteness = reviews.length ? average(reviews.map((review) => review.completenessScore)) : 0;

  if (scope.allowedMode === "do-not-operationalize" || telecom.requiredAction === "pause-live-telecom-dependence" || human.requiredAction === "pause-human-dependent-live-flow" || governance.requiredAction === "pause-live-pilot-for-governance-review") {
    return { decision: "do-not-run-or-pause-live-pilot", scope, telecom, human, governance, reviews, failedReadinessGates, certificationBoundary: "live-learning-is-not-readiness-certification" };
  }

  if (reviews.some((review) => review.requiredAction === "do-not-use-as-operational-truth")) {
    return { decision: "shadow-only-until-review-discipline-recovers", scope, telecom, human, governance, reviews, failedReadinessGates, certificationBoundary: "live-learning-is-not-readiness-certification" };
  }

  if (scope.allowedMode === "shadow-or-tabletop-only" || telecom.telecomRealityBand === "fragile" || human.humanRiskBand === "unstable" || governance.governanceFrictionBand === "high" || reviewCompleteness < 1) {
    return { decision: "restricted-supervised-live-learning", scope, telecom, human, governance, reviews, failedReadinessGates, certificationBoundary: "live-learning-is-not-readiness-certification" };
  }

  return {
    decision: "limited-live-low-risk-observation",
    scope,
    telecom,
    human,
    governance,
    reviews,
    failedReadinessGates,
    certificationBoundary: "live-learning-is-not-readiness-certification"
  };
}
