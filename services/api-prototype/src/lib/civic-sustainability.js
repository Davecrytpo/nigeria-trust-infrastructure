function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

export function modelLongHorizonSustainability(signal = {}) {
  const maintenance = clamp(signal.maintenanceContinuityScore ?? 0);
  const succession = clamp(signal.organizationalSuccessionReadiness ?? 0);
  const staffing = clamp(signal.staffingDurabilityScore ?? 0);
  const infrastructureAging = clamp(signal.infrastructureAgingRisk ?? 0);
  const operationalDecay = clamp(signal.operationalDecayRate ?? 0);
  const documentationContinuity = clamp(signal.documentationContinuityScore ?? 0);
  const risk = clamp(
    (1 - maintenance) * 0.2 +
    (1 - succession) * 0.18 +
    (1 - staffing) * 0.18 +
    infrastructureAging * 0.16 +
    operationalDecay * 0.18 +
    (1 - documentationContinuity) * 0.1
  );

  return {
    sustainabilityRiskScore: Number(risk.toFixed(3)),
    sustainabilityBand: risk >= 0.65 ? "unsustainable" : risk >= 0.4 ? "fragile" : risk >= 0.2 ? "watch" : "durable",
    requiredAction:
      risk >= 0.65
        ? "freeze-expansion-and-rebuild-operating-base"
        : risk >= 0.4
          ? "restrict-growth-and-fund-maintenance"
          : risk >= 0.2
            ? "increase-continuity-planning"
            : "continue-sustainability-monitoring"
  };
}

export function evaluateEconomicSurvivability(signal = {}) {
  const telecomCostGrowth = clamp(signal.telecomCostGrowthRate ?? 0);
  const smsCostExpansion = clamp(signal.smsCostExpansionRate ?? 0);
  const infrastructureCostGrowth = clamp(signal.infrastructureCostGrowthRate ?? 0);
  const responderSupportBurden = clamp(signal.responderSupportBurdenRate ?? 0);
  const fundingVolatility = clamp(signal.institutionalFundingVolatility ?? 0);
  const civicDependencyBurden = clamp(signal.civicDependencyBurdenRate ?? 0);
  const maintenanceAffordability = clamp(signal.maintenanceAffordabilityScore ?? 0);
  const risk = clamp(
    telecomCostGrowth * 0.16 +
    smsCostExpansion * 0.16 +
    infrastructureCostGrowth * 0.14 +
    responderSupportBurden * 0.14 +
    fundingVolatility * 0.16 +
    civicDependencyBurden * 0.12 +
    (1 - maintenanceAffordability) * 0.12
  );

  return {
    economicRiskScore: Number(risk.toFixed(3)),
    economicBand: risk >= 0.65 ? "economically-unsustainable" : risk >= 0.4 ? "cost-fragile" : risk >= 0.2 ? "watch" : "affordable",
    requiredAction:
      risk >= 0.65
        ? "pause-cost-expanding-operations"
        : risk >= 0.4
          ? "cap-telecom-and-infrastructure-costs"
          : risk >= 0.2
            ? "track-unit-costs-before-expansion"
            : "continue-cost-monitoring"
  };
}

export function modelOperatorGovernanceFatigue(signal = {}) {
  const exhaustion = clamp(signal.chronicOperationalExhaustionRate ?? 0);
  const reviewFatigue = clamp(signal.governanceReviewFatigueRate ?? 0);
  const complacency = clamp(signal.institutionalComplacencyRate ?? 0);
  const oversightDegradation = clamp(signal.oversightDegradationRate ?? 0);
  const shortcutNormalization = clamp(signal.humanShortcutNormalizationRate ?? 0);
  const proceduralAbandonment = clamp(signal.proceduralAbandonmentRate ?? 0);
  const risk = clamp(
    exhaustion * 0.18 +
    reviewFatigue * 0.18 +
    complacency * 0.16 +
    oversightDegradation * 0.18 +
    shortcutNormalization * 0.16 +
    proceduralAbandonment * 0.14
  );

  return {
    fatigueRiskScore: Number(risk.toFixed(3)),
    fatigueBand: risk >= 0.65 ? "burnout-critical" : risk >= 0.4 ? "fatigue-fragile" : risk >= 0.2 ? "watch" : "contained",
    requiredAction:
      risk >= 0.65
        ? "pause-operations-and-rotate-governance"
        : risk >= 0.4
          ? "reduce-operational-hours-and-review-load"
          : risk >= 0.2
            ? "increase-rest-and-governance-rotation"
            : "continue-fatigue-monitoring"
  };
}

export function modelCommunityTrustEvolution(signal = {}) {
  const trustAccumulation = clamp(signal.trustAccumulationScore ?? 0);
  const trustErosion = clamp(signal.trustErosionRate ?? 0);
  const expectationInflation = clamp(signal.expectationInflationRate ?? 0);
  const disappointmentMemory = clamp(signal.disappointmentMemoryRate ?? 0);
  const rumorPropagation = clamp(signal.rumorPropagationRate ?? 0);
  const perceivedBias = clamp(signal.perceivedBiasRate ?? 0);
  const fearAmplification = clamp(signal.fearAmplificationRate ?? 0);
  const legitimacyDrift = clamp(signal.civicLegitimacyDriftRate ?? 0);
  const risk = clamp(
    (1 - trustAccumulation) * 0.14 +
    trustErosion * 0.16 +
    expectationInflation * 0.12 +
    disappointmentMemory * 0.14 +
    rumorPropagation * 0.12 +
    perceivedBias * 0.14 +
    fearAmplification * 0.1 +
    legitimacyDrift * 0.08
  );

  return {
    trustRiskScore: Number(risk.toFixed(3)),
    trustBand: risk >= 0.65 ? "legitimacy-crisis" : risk >= 0.4 ? "trust-fragile" : risk >= 0.2 ? "watch" : "trusted",
    requiredAction:
      risk >= 0.65
        ? "pause-public-expansion-and-rebuild-trust"
        : risk >= 0.4
          ? "increase-community-review-and-transparency"
          : risk >= 0.2
            ? "monitor-community-expectations"
            : "continue-trust-stewardship"
  };
}

export function analyzeDependencyFragility(signal = {}) {
  const telecomDependency = clamp(signal.telecomProviderDependencyRate ?? 0);
  const cloudDependency = clamp(signal.cloudProviderDependencyRate ?? 0);
  const institutionalFragility = clamp(signal.institutionalPartnershipFragility ?? 0);
  const smsGatewayConcentration = clamp(signal.smsGatewayConcentrationRisk ?? 0);
  const regionalAsymmetry = clamp(signal.regionalInfrastructureAsymmetry ?? 0);
  const operatorTurnover = clamp(signal.operatorTurnoverRisk ?? 0);
  const risk = clamp(
    telecomDependency * 0.18 +
    cloudDependency * 0.14 +
    institutionalFragility * 0.18 +
    smsGatewayConcentration * 0.18 +
    regionalAsymmetry * 0.16 +
    operatorTurnover * 0.16
  );

  return {
    dependencyRiskScore: Number(risk.toFixed(3)),
    dependencyBand: risk >= 0.65 ? "critical-dependency" : risk >= 0.4 ? "fragile-dependency" : risk >= 0.2 ? "watch" : "resilient",
    requiredAction:
      risk >= 0.65
        ? "build-fallbacks-before-continuing-expansion"
        : risk >= 0.4
          ? "reduce-single-points-of-failure"
          : risk >= 0.2
            ? "document-dependency-contingencies"
            : "continue-dependency-monitoring"
  };
}

export function evaluateSustainableGovernance(signal = {}) {
  const renewableOversight = clamp(signal.renewableOversightScore ?? 0);
  const successionContinuity = clamp(signal.governanceSuccessionContinuity ?? 0);
  const rotatingAccountability = clamp(signal.rotatingAccountabilityScore ?? 0);
  const institutionalMemory = clamp(signal.institutionalMemoryPreservation ?? 0);
  const auditContinuity = clamp(signal.auditContinuityScore ?? 0);
  const distributedReview = clamp(signal.distributedReviewDurability ?? 0);
  const risk = clamp(
    (1 - renewableOversight) * 0.17 +
    (1 - successionContinuity) * 0.17 +
    (1 - rotatingAccountability) * 0.16 +
    (1 - institutionalMemory) * 0.17 +
    (1 - auditContinuity) * 0.17 +
    (1 - distributedReview) * 0.16
  );

  return {
    governanceSustainabilityRisk: Number(risk.toFixed(3)),
    governanceBand: risk >= 0.65 ? "governance-unsustainable" : risk >= 0.4 ? "governance-fragile" : risk >= 0.2 ? "watch" : "renewable",
    requiredAction:
      risk >= 0.65
        ? "rebuild-governance-continuity-before-operation"
        : risk >= 0.4
          ? "strengthen-rotating-oversight"
          : risk >= 0.2
            ? "schedule-governance-renewal"
            : "continue-governance-renewal"
  };
}

export function assessInfrastructureMinimalism(signal = {}) {
  const complexity = clamp(signal.operationalComplexityScore ?? 0);
  const featureGrowth = clamp(signal.unnecessaryFeatureGrowthRate ?? 0);
  const maintenanceBurden = clamp(signal.maintenanceBurdenAccumulation ?? 0);
  const governanceSurface = clamp(signal.governanceSurfaceExpansionRate ?? 0);
  const hiddenDebt = clamp(signal.hiddenOperationalDebtRate ?? 0);
  const risk = clamp(
    complexity * 0.22 +
    featureGrowth * 0.18 +
    maintenanceBurden * 0.22 +
    governanceSurface * 0.18 +
    hiddenDebt * 0.2
  );

  return {
    complexityRiskScore: Number(risk.toFixed(3)),
    minimalismBand: risk >= 0.65 ? "complexity-unsustainable" : risk >= 0.4 ? "complexity-fragile" : risk >= 0.2 ? "watch" : "minimal",
    requiredAction:
      risk >= 0.65
        ? "freeze-feature-growth-and-simplify"
        : risk >= 0.4
          ? "reduce-operational-complexity"
          : risk >= 0.2
            ? "review-maintenance-burden"
            : "continue-minimalism-review"
  };
}

export function modelCulturalAdaptation(signal = {}) {
  const regionalVariance = clamp(signal.regionalAdoptionVariance ?? 0);
  const localTrustVariance = clamp(signal.localTrustBehaviorVariance ?? 0);
  const participationVariance = clamp(signal.civicParticipationVariance ?? 0);
  const informalNormMismatch = clamp(signal.informalCoordinationMismatchRate ?? 0);
  const languageInterpretationGap = clamp(signal.languageInterpretationGapRate ?? 0);
  const integrityLossRisk = clamp(signal.adaptationIntegrityLossRisk ?? 0);
  const risk = clamp(
    regionalVariance * 0.15 +
    localTrustVariance * 0.16 +
    participationVariance * 0.15 +
    informalNormMismatch * 0.18 +
    languageInterpretationGap * 0.16 +
    integrityLossRisk * 0.2
  );

  return {
    adaptationRiskScore: Number(risk.toFixed(3)),
    adaptationBand: risk >= 0.65 ? "adaptation-unsafe" : risk >= 0.4 ? "adaptation-fragile" : risk >= 0.2 ? "watch" : "locally-compatible",
    requiredAction:
      risk >= 0.65
        ? "pause-region-expansion-and-redesign-local-fit"
        : risk >= 0.4
          ? "localize-with-integrity-review"
          : risk >= 0.2
            ? "increase-community-interpretation-work"
            : "continue-local-learning"
  };
}

export function modelRecoverySustainability(signal = {}) {
  const crisisRecoveryFatigue = clamp(signal.repeatedCrisisRecoveryFatigue ?? 0);
  const degradedNormalization = clamp(signal.degradedStateNormalizationRate ?? 0);
  const rollbackExhaustion = clamp(signal.longTermRollbackExhaustionRate ?? 0);
  const chronicAdaptation = clamp(signal.chronicInstabilityAdaptationRate ?? 0);
  const institutionalExhaustion = clamp(signal.institutionalRecoveryExhaustion ?? 0);
  const risk = clamp(
    crisisRecoveryFatigue * 0.22 +
    degradedNormalization * 0.2 +
    rollbackExhaustion * 0.18 +
    chronicAdaptation * 0.18 +
    institutionalExhaustion * 0.22
  );

  return {
    recoverySustainabilityRisk: Number(risk.toFixed(3)),
    recoveryBand: risk >= 0.65 ? "recovery-unsustainable" : risk >= 0.4 ? "recovery-fragile" : risk >= 0.2 ? "watch" : "recoverable",
    requiredAction:
      risk >= 0.65
        ? "pause-and-rebuild-recovery-capacity"
        : risk >= 0.4
          ? "reduce-crisis-load-and-rotate-recovery-roles"
          : risk >= 0.2
            ? "monitor-recovery-fatigue"
            : "continue-recovery-sustainability-monitoring"
  };
}

export function recommendCivicSustainabilityPosture(input = {}) {
  const longHorizon = modelLongHorizonSustainability(input.longHorizon);
  const economic = evaluateEconomicSurvivability(input.economic);
  const fatigue = modelOperatorGovernanceFatigue(input.fatigue);
  const trust = modelCommunityTrustEvolution(input.trust);
  const dependency = analyzeDependencyFragility(input.dependency);
  const governance = evaluateSustainableGovernance(input.governance);
  const minimalism = assessInfrastructureMinimalism(input.minimalism);
  const cultural = modelCulturalAdaptation(input.cultural);
  const recovery = modelRecoverySustainability(input.recovery);
  const hardStop = [
    longHorizon.sustainabilityBand,
    economic.economicBand,
    fatigue.fatigueBand,
    trust.trustBand,
    dependency.dependencyBand,
    governance.governanceBand,
    minimalism.minimalismBand,
    cultural.adaptationBand,
    recovery.recoveryBand
  ].some((band) => band.includes("unsustainable") || band.includes("critical") || band.includes("crisis") || band.includes("unsafe"));
  const riskScore = clamp(
    longHorizon.sustainabilityRiskScore * 0.12 +
    economic.economicRiskScore * 0.13 +
    fatigue.fatigueRiskScore * 0.12 +
    trust.trustRiskScore * 0.13 +
    dependency.dependencyRiskScore * 0.12 +
    governance.governanceSustainabilityRisk * 0.12 +
    minimalism.complexityRiskScore * 0.1 +
    cultural.adaptationRiskScore * 0.08 +
    recovery.recoverySustainabilityRisk * 0.08
  );

  return {
    posture: hardStop
      ? "sustainability-freeze"
      : riskScore >= 0.4
        ? "restrict-and-rebuild-sustainability"
        : riskScore >= 0.22
          ? "heightened-sustainability-watch"
          : "continue-sustainable-limited-operation",
    riskScore: Number(riskScore.toFixed(3)),
    longHorizon,
    economic,
    fatigue,
    trust,
    dependency,
    governance,
    minimalism,
    cultural,
    recovery,
    certificationBoundary: "sustainability-supports-survivability-but-does-not-certify-readiness"
  };
}
