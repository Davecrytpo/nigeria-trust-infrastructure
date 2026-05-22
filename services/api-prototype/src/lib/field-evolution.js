function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function slope(values) {
  if (values.length < 2) return 0;
  const n = values.length;
  const meanX = (n - 1) / 2;
  const meanY = average(values);
  const numerator = values.reduce((sum, value, index) => sum + (index - meanX) * (value - meanY), 0);
  const denominator = values.reduce((sum, _value, index) => sum + (index - meanX) ** 2, 0);
  return denominator ? numerator / denominator : 0;
}

function trendScore(values, direction = "increase") {
  const trend = slope(values);
  return Number(clamp(direction === "increase" ? trend : -trend).toFixed(3));
}

export function modelOperationalDrift(series = []) {
  const responderDecline = trendScore(series.map((point) => point.responderReliability ?? 1), "decrease");
  const operatorJudgmentDrift = trendScore(series.map((point) => point.operatorJudgmentErrorRate ?? 0), "increase");
  const governanceInconsistencyGrowth = trendScore(series.map((point) => point.governanceInconsistencyRate ?? 0), "increase");
  const telecomRecurrenceGrowth = trendScore(series.map((point) => point.telecomDegradationRate ?? 0), "increase");
  const institutionalVolatilityGrowth = trendScore(series.map((point) => point.institutionalParticipationVolatility ?? 0), "increase");
  const auditQualityDecline = trendScore(series.map((point) => point.auditQualityScore ?? 1), "decrease");
  const escalationDeterioration = trendScore(series.map((point) => point.p95EscalationMinutes ?? 0), "increase");
  const driftScore = clamp(
    responderDecline * 0.15 +
    operatorJudgmentDrift * 0.15 +
    governanceInconsistencyGrowth * 0.15 +
    telecomRecurrenceGrowth * 0.14 +
    institutionalVolatilityGrowth * 0.14 +
    auditQualityDecline * 0.13 +
    escalationDeterioration * 0.14
  );

  return {
    driftScore: Number(driftScore.toFixed(3)),
    driftBand: driftScore >= 0.12 ? "severe-drift" : driftScore >= 0.07 ? "material-drift" : driftScore >= 0.03 ? "watch-drift" : "stable",
    components: {
      responderDecline,
      operatorJudgmentDrift,
      governanceInconsistencyGrowth,
      telecomRecurrenceGrowth,
      institutionalVolatilityGrowth,
      auditQualityDecline,
      escalationDeterioration
    }
  };
}

export function detectChronicDegradedNormalization(series = [], narrative = {}) {
  const degradedHours = series.map((point) => point.degradedModeHoursPerDay ?? 0);
  const operatorComfort = series.map((point) => point.operatorDegradedComfortScore ?? 0);
  const responderAdaptation = series.map((point) => point.responderInstabilityAdaptationScore ?? 0);
  const governanceTolerance = series.map((point) => point.governanceToleranceScore ?? 0);
  const coordinationDelayAcceptance = series.map((point) => point.delayedCoordinationAcceptanceRate ?? 0);
  const standardsReduction = series.map((point) => point.operationalStandardsReductionRate ?? 0);
  const indicators = [];

  if (average(degradedHours) >= 4 && (narrative.reportedMode ?? "normal") === "normal") indicators.push("degraded-state-described-as-normal");
  if (trendScore(operatorComfort, "increase") >= 0.04 || average(operatorComfort) >= 0.55) indicators.push("operator-comfort-with-degradation");
  if (trendScore(responderAdaptation, "increase") >= 0.04 || average(responderAdaptation) >= 0.55) indicators.push("responder-adaptation-to-instability");
  if (trendScore(governanceTolerance, "increase") >= 0.04 || average(governanceTolerance) >= 0.5) indicators.push("governance-tolerance-inflation");
  if (trendScore(coordinationDelayAcceptance, "increase") >= 0.04 || average(coordinationDelayAcceptance) >= 0.45) indicators.push("delayed-coordination-accepted");
  if (trendScore(standardsReduction, "increase") >= 0.03 || average(standardsReduction) >= 0.35) indicators.push("operational-standards-reduced");

  return {
    indicators,
    normalizationBand: indicators.length >= 5 ? "critical" : indicators.length >= 3 ? "serious" : indicators.length >= 1 ? "watch" : "clear",
    requiredAction:
      indicators.length >= 5
        ? "freeze-prolonged-live-operation"
        : indicators.length >= 3
          ? "restrict-and-reset-operational-standards"
          : indicators.length >= 1
            ? "increase-supervision-and-disclose-degradation"
            : "continue-monitoring"
  };
}

export function modelHumanFatigueEvolution(series = []) {
  const alertExhaustion = trendScore(series.map((point) => point.alertExhaustionRate ?? 0), "increase");
  const supervisorBurnout = trendScore(series.map((point) => point.supervisorBurnoutRate ?? 0), "increase");
  const cognitiveOverload = trendScore(series.map((point) => point.cognitiveOverloadRate ?? 0), "increase");
  const escalationAvoidance = trendScore(series.map((point) => point.escalationAvoidanceRate ?? 0), "increase");
  const trustReviewFatigue = trendScore(series.map((point) => point.trustReviewFatigueRate ?? 0), "increase");
  const riskDesensitization = trendScore(series.map((point) => point.riskSignalDesensitizationRate ?? 0), "increase");
  const fatigueScore = clamp(
    alertExhaustion * 0.18 +
    supervisorBurnout * 0.18 +
    cognitiveOverload * 0.18 +
    escalationAvoidance * 0.16 +
    trustReviewFatigue * 0.15 +
    riskDesensitization * 0.15
  );

  return {
    fatigueScore: Number(fatigueScore.toFixed(3)),
    fatigueBand: fatigueScore >= 0.12 ? "severe-fatigue-drift" : fatigueScore >= 0.07 ? "material-fatigue-drift" : fatigueScore >= 0.03 ? "watch-fatigue" : "contained",
    components: { alertExhaustion, supervisorBurnout, cognitiveOverload, escalationAvoidance, trustReviewFatigue, riskDesensitization }
  };
}

export function modelTelecomEvolution(series = []) {
  const providerReliabilityDecline = trendScore(series.map((point) => point.providerReliabilityScore ?? 1), "decrease");
  const outageGeographyGrowth = trendScore(series.map((point) => point.outageGeographyRate ?? 0), "increase");
  const seasonalCongestionGrowth = trendScore(series.map((point) => point.seasonalCongestionScore ?? 0), "increase");
  const smsDeliveryDrift = trendScore(series.map((point) => point.p95SmsLatencySeconds ?? 0), "increase");
  const androidFragmentationGrowth = trendScore(series.map((point) => point.androidFragmentationFailureRate ?? 0), "increase");
  const batteryDegradationGrowth = trendScore(series.map((point) => point.deviceBatteryFailureRate ?? 0), "increase");
  const telecomEvolutionScore = clamp(
    providerReliabilityDecline * 0.18 +
    outageGeographyGrowth * 0.17 +
    seasonalCongestionGrowth * 0.15 +
    smsDeliveryDrift * 0.0015 +
    androidFragmentationGrowth * 0.18 +
    batteryDegradationGrowth * 0.17
  );

  return {
    telecomEvolutionScore: Number(telecomEvolutionScore.toFixed(3)),
    telecomEvolutionBand: telecomEvolutionScore >= 0.12 ? "deteriorating" : telecomEvolutionScore >= 0.07 ? "unstable" : telecomEvolutionScore >= 0.03 ? "watch" : "stable",
    components: { providerReliabilityDecline, outageGeographyGrowth, seasonalCongestionGrowth, smsDeliveryDrift, androidFragmentationGrowth, batteryDegradationGrowth }
  };
}

export function validateGovernanceDurability(series = []) {
  const participationDecline = trendScore(series.map((point) => point.institutionalParticipationRate ?? 1), "decrease");
  const supervisorInconsistency = trendScore(series.map((point) => point.supervisorInconsistencyRate ?? 0), "increase");
  const auditCompletionDecline = trendScore(series.map((point) => point.auditCompletionRate ?? 1), "decrease");
  const policyAdherenceDecline = trendScore(series.map((point) => point.policyAdherenceRate ?? 1), "decrease");
  const authorityMisuseGrowth = trendScore(series.map((point) => point.emergencyAuthorityMisuseRate ?? 0), "increase");
  const shortcutGrowth = trendScore(series.map((point) => point.governanceShortcutRate ?? 0), "increase");
  const governanceDecayScore = clamp(
    participationDecline * 0.17 +
    supervisorInconsistency * 0.17 +
    auditCompletionDecline * 0.18 +
    policyAdherenceDecline * 0.18 +
    authorityMisuseGrowth * 0.15 +
    shortcutGrowth * 0.15
  );

  return {
    governanceDecayScore: Number(governanceDecayScore.toFixed(3)),
    governanceDecayBand: governanceDecayScore >= 0.12 ? "failing" : governanceDecayScore >= 0.07 ? "eroding" : governanceDecayScore >= 0.03 ? "watch" : "durable",
    components: { participationDecline, supervisorInconsistency, auditCompletionDecline, policyAdherenceDecline, authorityMisuseGrowth, shortcutGrowth }
  };
}

export function modelTrustErosion(series = []) {
  const residentTrustDecline = trendScore(series.map((point) => point.residentTrustScore ?? 1), "decrease");
  const responderAbandonmentGrowth = trendScore(series.map((point) => point.responderAbandonmentRate ?? 0), "increase");
  const falseAlertEffectGrowth = trendScore(series.map((point) => point.falseAlertImpactRate ?? 0), "increase");
  const disappointmentGrowth = trendScore(series.map((point) => point.coordinationDisappointmentRate ?? 0), "increase");
  const institutionalSkepticismGrowth = trendScore(series.map((point) => point.institutionalSkepticismRate ?? 0), "increase");
  const trustErosionScore = clamp(
    residentTrustDecline * 0.24 +
    responderAbandonmentGrowth * 0.2 +
    falseAlertEffectGrowth * 0.18 +
    disappointmentGrowth * 0.2 +
    institutionalSkepticismGrowth * 0.18
  );

  return {
    trustErosionScore: Number(trustErosionScore.toFixed(3)),
    trustErosionBand: trustErosionScore >= 0.12 ? "eroding" : trustErosionScore >= 0.07 ? "strained" : trustErosionScore >= 0.03 ? "watch" : "stable",
    components: { residentTrustDecline, responderAbandonmentGrowth, falseAlertEffectGrowth, disappointmentGrowth, institutionalSkepticismGrowth }
  };
}

export function assessContinuityResilience(signal = {}) {
  const staffingContinuity = clamp(signal.staffingContinuityScore ?? 0);
  const successionReadiness = clamp(signal.supervisorSuccessionReadiness ?? 0);
  const replacementImpact = clamp(signal.supervisorReplacementImpactRate ?? 0);
  const institutionalDependency = clamp(signal.singleInstitutionDependencyRate ?? 0);
  const knowledgeConcentration = clamp(signal.localizedKnowledgeConcentrationRate ?? 0);
  const continuityRisk = clamp(
    (1 - staffingContinuity) * 0.22 +
    (1 - successionReadiness) * 0.22 +
    replacementImpact * 0.18 +
    institutionalDependency * 0.18 +
    knowledgeConcentration * 0.2
  );

  return {
    continuityRiskScore: Number(continuityRisk.toFixed(3)),
    continuityBand: continuityRisk >= 0.65 ? "fragile" : continuityRisk >= 0.4 ? "strained" : continuityRisk >= 0.2 ? "watch" : "resilient",
    requiredAction:
      continuityRisk >= 0.65
        ? "pause-expansion-and-build-succession"
        : continuityRisk >= 0.4
          ? "restrict-operations-and-cross-train"
          : continuityRisk >= 0.2
            ? "increase-continuity-drills"
            : "continue-continuity-monitoring"
  };
}

export function recommendFieldEvolutionPosture(input = {}) {
  const series = input.series ?? [];
  const drift = modelOperationalDrift(series);
  const normalization = detectChronicDegradedNormalization(series, input.narrative);
  const fatigue = modelHumanFatigueEvolution(series);
  const telecom = modelTelecomEvolution(series);
  const governance = validateGovernanceDurability(series);
  const trust = modelTrustErosion(series);
  const continuity = assessContinuityResilience(input.continuity);
  const slowFailureScore = clamp(
    drift.driftScore * 0.16 +
    (normalization.normalizationBand === "critical" ? 0.18 : normalization.normalizationBand === "serious" ? 0.12 : normalization.normalizationBand === "watch" ? 0.06 : 0) +
    fatigue.fatigueScore * 0.14 +
    telecom.telecomEvolutionScore * 0.14 +
    governance.governanceDecayScore * 0.16 +
    trust.trustErosionScore * 0.14 +
    continuity.continuityRiskScore * 0.08
  );

  return {
    posture:
      normalization.requiredAction === "freeze-prolonged-live-operation" || governance.governanceDecayBand === "failing"
        ? "freeze-prolonged-live-operation"
        : slowFailureScore >= 0.12
          ? "restrict-and-reset-long-duration-operations"
          : slowFailureScore >= 0.08
            ? "supervised-continuity-watch"
            : "continue-limited-long-duration-learning",
    slowFailureScore: Number(slowFailureScore.toFixed(3)),
    drift,
    normalization,
    fatigue,
    telecom,
    governance,
    trust,
    continuity,
    certificationBoundary: "long-duration-operation-is-not-readiness-certification"
  };
}
