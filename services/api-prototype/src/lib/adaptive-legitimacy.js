function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

export function detectMissionDrift(signal = {}) {
  const purposeExpansion = clamp(signal.purposeExpansionRate ?? 0);
  const featureCreep = clamp(signal.silentFeatureCreepRate ?? 0);
  const authorityGrowth = clamp(signal.authorityScopeGrowthRate ?? 0);
  const governanceDilution = clamp(signal.governanceDilutionRate ?? 0);
  const operationalOverreach = clamp(signal.operationalOverreachRate ?? 0);
  const identityErosion = clamp(signal.infrastructureIdentityErosionRate ?? 0);
  const score = clamp(
    purposeExpansion * 0.18 +
    featureCreep * 0.16 +
    authorityGrowth * 0.18 +
    governanceDilution * 0.17 +
    operationalOverreach * 0.16 +
    identityErosion * 0.15
  );

  return {
    missionDriftScore: Number(score.toFixed(3)),
    driftBand: score >= 0.65 ? "identity-failure" : score >= 0.4 ? "mission-drift" : score >= 0.2 ? "watch" : "aligned",
    requiredAction:
      score >= 0.65
        ? "freeze-evolution-and-reaffirm-civic-purpose"
        : score >= 0.4
          ? "restrict-expansion-and-run-mission-review"
          : score >= 0.2
            ? "increase-purpose-audit"
            : "continue-purpose-monitoring"
  };
}

export function modelAdaptiveLegitimacy(signal = {}) {
  const publicExpectationShift = clamp(signal.publicExpectationShiftRate ?? 0);
  const civicNormShift = clamp(signal.civicNormShiftRate ?? 0);
  const institutionalTrustShift = clamp(signal.institutionalTrustShiftRate ?? 0);
  const generationalPerceptionGap = clamp(signal.generationalPerceptionGapRate ?? 0);
  const regionalVariance = clamp(signal.regionalLegitimacyVariance ?? 0);
  const reputationVolatility = clamp(signal.longTermReputationVolatility ?? 0);
  const score = clamp(
    publicExpectationShift * 0.17 +
    civicNormShift * 0.16 +
    institutionalTrustShift * 0.17 +
    generationalPerceptionGap * 0.15 +
    regionalVariance * 0.17 +
    reputationVolatility * 0.18
  );

  return {
    legitimacyRiskScore: Number(score.toFixed(3)),
    legitimacyBand: score >= 0.65 ? "legitimacy-crisis" : score >= 0.4 ? "legitimacy-fragile" : score >= 0.2 ? "watch" : "legitimate",
    requiredAction:
      score >= 0.65
        ? "pause-evolution-and-rebuild-public-legitimacy"
        : score >= 0.4
          ? "run-civic-legitimacy-review"
          : score >= 0.2
            ? "increase-community-sensemaking"
            : "continue-legitimacy-monitoring"
  };
}

export function restrainTechnologyExpansion(signal = {}) {
  const aiAutomation = clamp(signal.aiOverAutomationPressure ?? 0);
  const predictiveGovernance = clamp(signal.predictiveGovernanceIncentive ?? 0);
  const telemetryDependence = clamp(signal.excessTelemetryDependence ?? 0);
  const biometricPressure = clamp(signal.biometricExpansionPressure ?? 0);
  const automatedAuthority = clamp(signal.automatedAuthorityEscalationRate ?? 0);
  const optimizationSurveillance = clamp(signal.optimizationDrivenSurveillanceDrift ?? 0);
  const score = clamp(
    aiAutomation * 0.18 +
    predictiveGovernance * 0.18 +
    telemetryDependence * 0.15 +
    biometricPressure * 0.18 +
    automatedAuthority * 0.16 +
    optimizationSurveillance * 0.15
  );

  return {
    technologyExpansionRisk: Number(score.toFixed(3)),
    technologyBand: score >= 0.65 ? "technology-overreach" : score >= 0.4 ? "governance-constrained-risk" : score >= 0.2 ? "watch" : "restrained",
    requiredAction:
      score >= 0.65
        ? "freeze-technology-expansion"
        : score >= 0.4
          ? "require-governance-before-technology-growth"
          : score >= 0.2
            ? "review-technology-restraint"
            : "continue-technology-restraint"
  };
}

export function controlComplexityAccumulation(signal = {}) {
  const governanceSurface = clamp(signal.governanceSurfaceExpansionRate ?? 0);
  const dependencyGrowth = clamp(signal.operationalDependencyGrowthRate ?? 0);
  const maintenanceInflation = clamp(signal.maintenanceBurdenInflationRate ?? 0);
  const coordinationOverload = clamp(signal.institutionalCoordinationOverloadRate ?? 0);
  const architecturalFragility = clamp(signal.hiddenArchitecturalFragilityRate ?? 0);
  const score = clamp(
    governanceSurface * 0.2 +
    dependencyGrowth * 0.2 +
    maintenanceInflation * 0.2 +
    coordinationOverload * 0.18 +
    architecturalFragility * 0.22
  );

  return {
    complexityScore: Number(score.toFixed(3)),
    complexityBand: score >= 0.65 ? "unmanageable-complexity" : score >= 0.4 ? "complexity-fragile" : score >= 0.2 ? "watch" : "controlled",
    requiredAction:
      score >= 0.65
        ? "freeze-and-simplify-infrastructure"
        : score >= 0.4
          ? "reduce-complexity-before-expansion"
          : score >= 0.2
            ? "review-complexity-budget"
            : "continue-complexity-control"
  };
}

export function preserveFoundingPrinciples(signal = {}) {
  const failures = [];

  if ((signal.minimumNecessaryAuthorityScore ?? 1) < 0.85) failures.push("minimum-necessary-authority-weak");
  if ((signal.reversibleDeploymentScore ?? 1) < 0.85) failures.push("reversible-deployment-weak");
  if ((signal.uncertaintyVisibilityScore ?? 1) < 0.85) failures.push("uncertainty-visibility-weak");
  if ((signal.humanAccountabilityScore ?? 1) < 0.85) failures.push("human-accountability-weak");
  if ((signal.operationalRestraintScore ?? 1) < 0.85) failures.push("operational-restraint-weak");
  if ((signal.privacyBoundaryScore ?? 1) < 0.85) failures.push("privacy-boundary-weak");
  if ((signal.explainableGovernanceScore ?? 1) < 0.85) failures.push("explainable-governance-weak");

  return {
    failures,
    principleBand: failures.length >= 5 ? "principles-broken" : failures.length >= 2 ? "principles-at-risk" : failures.length === 1 ? "watch" : "preserved",
    requiredAction:
      failures.length >= 5
        ? "freeze-evolution-and-restore-principles"
        : failures.length >= 2
          ? "restrict-evolution-and-remediate-principles"
          : failures.length === 1
            ? "repair-principle-gap"
            : "continue-principle-audit"
  };
}

export function checkSocietalAlignment(signal = {}) {
  const perceivedValue = clamp(signal.communityPerceivedValueScore ?? 0);
  const livedRealityFit = clamp(signal.livedRealityFitScore ?? 0);
  const governanceUnderstandability = clamp(signal.governanceUnderstandabilityScore ?? 0);
  const operatorTrust = clamp(signal.operatorTrustScore ?? 0);
  const institutionalParticipationHealth = clamp(signal.institutionalParticipationHealth ?? 0);
  const alignmentRisk = clamp(
    (1 - perceivedValue) * 0.22 +
    (1 - livedRealityFit) * 0.22 +
    (1 - governanceUnderstandability) * 0.2 +
    (1 - operatorTrust) * 0.18 +
    (1 - institutionalParticipationHealth) * 0.18
  );

  return {
    alignmentRiskScore: Number(alignmentRisk.toFixed(3)),
    alignmentBand: alignmentRisk >= 0.65 ? "misaligned" : alignmentRisk >= 0.4 ? "alignment-fragile" : alignmentRisk >= 0.2 ? "watch" : "aligned",
    requiredAction:
      alignmentRisk >= 0.65
        ? "pause-evolution-and-realign-with-community"
        : alignmentRisk >= 0.4
          ? "run-societal-alignment-review"
          : alignmentRisk >= 0.2
            ? "increase-community-feedback"
            : "continue-alignment-monitoring"
  };
}

export function assessEvolutionaryOversight(signal = {}) {
  const gaps = [];

  if (!signal.periodicLegitimacyReview) gaps.push("periodic-legitimacy-review-missing");
  if (!signal.externalCivicReviewPathway) gaps.push("external-civic-review-pathway-missing");
  if (!signal.governanceRenewalCheckpoint) gaps.push("governance-renewal-checkpoint-missing");
  if (!signal.institutionalDriftAudit) gaps.push("institutional-drift-audit-missing");
  if (!signal.principleComplianceReview) gaps.push("principle-compliance-review-missing");
  if (!signal.infrastructureSimplificationReview) gaps.push("infrastructure-simplification-review-missing");

  return {
    gaps,
    oversightBand: gaps.length >= 4 ? "oversight-insufficient" : gaps.length >= 2 ? "oversight-fragile" : gaps.length === 1 ? "watch" : "renewable",
    requiredAction:
      gaps.length >= 4
        ? "do-not-approve-evolution"
        : gaps.length >= 2
          ? "complete-evolutionary-oversight-before-change"
          : gaps.length === 1
            ? "repair-oversight-gap"
            : "continue-renewal-oversight"
  };
}

export function detectPermanentEmergency(signal = {}) {
  const exceptionalPowerNormalization = clamp(signal.exceptionalPowerNormalizationRate ?? 0);
  const endlessDegradedGovernance = clamp(signal.endlessDegradedGovernanceRate ?? 0);
  const perpetualEmergencyAuthority = clamp(signal.perpetualEmergencyAuthorityRate ?? 0);
  const escalationHabituation = clamp(signal.escalationHabituationRate ?? 0);
  const operatorOverrideCulture = clamp(signal.chronicOperatorOverrideCultureRate ?? 0);
  const score = clamp(
    exceptionalPowerNormalization * 0.22 +
    endlessDegradedGovernance * 0.2 +
    perpetualEmergencyAuthority * 0.22 +
    escalationHabituation * 0.18 +
    operatorOverrideCulture * 0.18
  );

  return {
    emergencyNormalizationScore: Number(score.toFixed(3)),
    emergencyBand: score >= 0.65 ? "permanent-emergency-risk" : score >= 0.4 ? "emergency-normalizing" : score >= 0.2 ? "watch" : "contained",
    requiredAction:
      score >= 0.65
        ? "terminate-exceptional-authority-and-review"
        : score >= 0.4
          ? "timebox-emergency-authority"
          : score >= 0.2
            ? "increase-exceptional-power-review"
            : "continue-emergency-boundary-monitoring"
  };
}

export function recommendAdaptiveLegitimacyPosture(input = {}) {
  const mission = detectMissionDrift(input.mission);
  const legitimacy = modelAdaptiveLegitimacy(input.legitimacy);
  const technology = restrainTechnologyExpansion(input.technology);
  const complexity = controlComplexityAccumulation(input.complexity);
  const principles = preserveFoundingPrinciples(input.principles);
  const alignment = checkSocietalAlignment(input.alignment);
  const oversight = assessEvolutionaryOversight(input.oversight);
  const emergency = detectPermanentEmergency(input.emergency);
  const hardStop = [
    mission.driftBand,
    legitimacy.legitimacyBand,
    technology.technologyBand,
    complexity.complexityBand,
    principles.principleBand,
    alignment.alignmentBand,
    oversight.oversightBand,
    emergency.emergencyBand
  ].some((band) => band.includes("failure") || band.includes("crisis") || band.includes("overreach") || band.includes("unmanageable") || band.includes("broken") || band.includes("misaligned") || band.includes("insufficient") || band.includes("permanent-emergency"));
  const riskScore = clamp(
    mission.missionDriftScore * 0.15 +
    legitimacy.legitimacyRiskScore * 0.14 +
    technology.technologyExpansionRisk * 0.14 +
    complexity.complexityScore * 0.12 +
    (principles.principleBand === "principles-broken" ? 0.13 : principles.principleBand === "principles-at-risk" ? 0.08 : principles.principleBand === "watch" ? 0.04 : 0) +
    alignment.alignmentRiskScore * 0.13 +
    (oversight.oversightBand === "oversight-insufficient" ? 0.1 : oversight.oversightBand === "oversight-fragile" ? 0.06 : oversight.oversightBand === "watch" ? 0.03 : 0) +
    emergency.emergencyNormalizationScore * 0.09
  );

  return {
    posture: hardStop
      ? "adaptive-legitimacy-freeze"
      : riskScore >= 0.4
        ? "restrict-evolution-and-renew-legitimacy"
        : riskScore >= 0.22
          ? "heightened-legitimacy-watch"
          : "continue-principled-evolution",
    riskScore: Number(riskScore.toFixed(3)),
    mission,
    legitimacy,
    technology,
    complexity,
    principles,
    alignment,
    oversight,
    emergency,
    certificationBoundary: "adaptive-legitimacy-guides-evolution-but-does-not-certify-readiness"
  };
}
