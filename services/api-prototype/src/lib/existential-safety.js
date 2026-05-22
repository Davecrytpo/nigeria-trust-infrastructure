function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

export function modelIrreversibilityRisk(signal = {}) {
  const risk = clamp(
    (signal.societalDependencyAccumulation ?? 0) * 0.18 +
    (signal.institutionalLockInRate ?? 0) * 0.18 +
    (signal.coordinationMonocultureFormation ?? 0) * 0.18 +
    (signal.operationalIrreversibilityRisk ?? 0) * 0.18 +
    (signal.replacementImpossibilityRisk ?? 0) * 0.16 +
    (signal.overCentralizedEmergencyReliance ?? 0) * 0.12
  );

  return {
    irreversibilityRisk: Number(risk.toFixed(3)),
    irreversibilityBand: risk >= 0.65 ? "irreversible-dependency" : risk >= 0.4 ? "lock-in-fragile" : risk >= 0.2 ? "watch" : "removable",
    requiredAction:
      risk >= 0.65
        ? "freeze-and-reduce-societal-dependency"
        : risk >= 0.4
          ? "restrict-and-build-exit-paths"
          : risk >= 0.2
            ? "monitor-lock-in-pressure"
            : "continue-removability-monitoring"
  };
}

export function preserveCivicSelfSufficiency(signal = {}) {
  const score = clamp(
    (signal.localInitiativeScore ?? 0) * 0.18 +
    (signal.decentralizedCoordinationScore ?? 0) * 0.18 +
    (signal.offlineCommunityCapabilityScore ?? 0) * 0.18 +
    (signal.independentInstitutionalCompetence ?? 0) * 0.18 +
    (signal.nonPlatformEmergencyPathwayScore ?? 0) * 0.16 +
    (signal.manualFallbackGovernanceScore ?? 0) * 0.12
  );

  return {
    selfSufficiencyScore: Number(score.toFixed(3)),
    selfSufficiencyBand: score >= 0.75 ? "strong-self-sufficiency" : score >= 0.55 ? "adequate" : score >= 0.35 ? "fragile" : "self-sufficiency-collapsed",
    requiredAction:
      score >= 0.75
        ? "continue-independent-capability-preservation"
        : score >= 0.55
          ? "strengthen-manual-and-community-capacity"
          : score >= 0.35
            ? "restrict-platform-dependence-and-train-fallbacks"
            : "freeze-and-restore-non-platform-capability"
  };
}

export function modelFailureSurvivability(signal = {}) {
  const risk = clamp(
    (signal.catastrophicShutdownDestabilizationRisk ?? 0) * 0.16 +
    (signal.telecomCollapseImpact ?? 0) * 0.14 +
    (signal.governanceCollapseImpact ?? 0) * 0.16 +
    (signal.institutionalWithdrawalImpact ?? 0) * 0.14 +
    (signal.cloudProviderDisappearanceImpact ?? 0) * 0.14 +
    (signal.operatorAbandonmentImpact ?? 0) * 0.14 +
    (signal.publicTrustCollapseImpact ?? 0) * 0.12
  );

  return {
    failureSurvivabilityRisk: Number(risk.toFixed(3)),
    survivabilityBand: risk >= 0.65 ? "unsafe-failure" : risk >= 0.4 ? "failure-fragile" : risk >= 0.2 ? "watch" : "safe-degradation",
    requiredAction:
      risk >= 0.65
        ? "freeze-and-design-safe-collapse-paths"
        : risk >= 0.4
          ? "strengthen-catastrophic-fallbacks"
          : risk >= 0.2
            ? "test-failure-survivability"
            : "continue-safe-failure-monitoring"
  };
}

export function protectAntiMonopolyCoordination(signal = {}) {
  const risk = clamp(
    (signal.singleSystemEmergencyDependence ?? 0) * 0.2 +
    (signal.coordinationMonopolizationRisk ?? 0) * 0.2 +
    (signal.institutionalOverCentralizationRate ?? 0) * 0.18 +
    (signal.platformExclusiveWorkflowRate ?? 0) * 0.18 +
    (signal.governanceSinglePointRisk ?? 0) * 0.16 +
    (signal.alternativeCoordinationSuppression ?? 0) * 0.08
  );

  return {
    monopolyRisk: Number(risk.toFixed(3)),
    monopolyBand: risk >= 0.65 ? "coordination-monopoly" : risk >= 0.4 ? "monopoly-fragile" : risk >= 0.2 ? "watch" : "plurality-preserved",
    requiredAction:
      risk >= 0.65
        ? "freeze-and-restore-coordination-plurality"
        : risk >= 0.4
          ? "require-non-platform-workflows"
          : risk >= 0.2
            ? "monitor-coordination-concentration"
            : "continue-anti-monopoly-monitoring"
  };
}

export function assessReversibleInfrastructure(signal = {}) {
  const score = clamp(
    (signal.gracefulShutdownPathwayScore ?? 0) * 0.18 +
    (signal.regionalDecouplingScore ?? 0) * 0.16 +
    (signal.partialRetirementCapability ?? 0) * 0.16 +
    (signal.controlledDecommissioningScore ?? 0) * 0.18 +
    (signal.communityTransitionPlanScore ?? 0) * 0.16 +
    (signal.fallbackOperationalContinuityScore ?? 0) * 0.16
  );

  return {
    reversibilityScore: Number(score.toFixed(3)),
    reversibilityBand: score >= 0.75 ? "reversible" : score >= 0.55 ? "partially-reversible" : score >= 0.35 ? "fragile-reversibility" : "non-reversible",
    requiredAction:
      score >= 0.75
        ? "continue-reversible-operation"
        : score >= 0.55
          ? "improve-decommissioning-readiness"
          : score >= 0.35
            ? "restrict-until-exit-paths-are-credible"
            : "freeze-and-build-removal-pathways"
  };
}

export function analyzeCivilizationalCoupling(signal = {}) {
  const risk = clamp(
    (signal.institutionalIntegrationDepth ?? 0) * 0.2 +
    (signal.socialAutonomyLossRate ?? 0) * 0.18 +
    (signal.responderPlatformDependence ?? 0) * 0.18 +
    (signal.emergencyCultureIrreversibility ?? 0) * 0.18 +
    (signal.platformCoupledGovernanceAssumptions ?? 0) * 0.16 +
    (signal.civilizationScaleFailureCoupling ?? 0) * 0.1
  );

  return {
    couplingRisk: Number(risk.toFixed(3)),
    couplingBand: risk >= 0.65 ? "civilization-scale-coupling" : risk >= 0.4 ? "coupling-fragile" : risk >= 0.2 ? "watch" : "loosely-coupled",
    requiredAction:
      risk >= 0.65
        ? "freeze-and-decouple-civic-systems"
        : risk >= 0.4
          ? "reduce-platform-coupled-assumptions"
          : risk >= 0.2
            ? "monitor-coupling-depth"
            : "continue-loose-coupling-monitoring"
  };
}

export function preserveRedundantSocietalCapability(signal = {}) {
  const score = clamp(
    (signal.independentEmergencyProcedureScore ?? 0) * 0.18 +
    (signal.nonDigitalCoordinationNormScore ?? 0) * 0.18 +
    (signal.communityPreparednessScore ?? 0) * 0.18 +
    (signal.institutionalDiversityScore ?? 0) * 0.16 +
    (signal.distributedGovernanceScore ?? 0) * 0.16 +
    (signal.manualOperationalCompetenceScore ?? 0) * 0.14
  );

  return {
    redundancyScore: Number(score.toFixed(3)),
    redundancyBand: score >= 0.75 ? "strong-redundancy" : score >= 0.55 ? "adequate" : score >= 0.35 ? "fragile" : "redundancy-collapsed",
    requiredAction:
      score >= 0.75
        ? "continue-redundant-capability-preservation"
        : score >= 0.55
          ? "reinforce-independent-procedures"
          : score >= 0.35
            ? "restrict-and-rebuild-manual-capability"
            : "freeze-and-restore-societal-redundancy"
  };
}

export function enforcePowerLimitingPrinciples(signal = {}) {
  const score = clamp(
    (signal.constrainedAuthorityScore ?? 0) * 0.18 +
    (signal.boundedOperationalScopeScore ?? 0) * 0.16 +
    (signal.removableGovernanceLayerScore ?? 0) * 0.18 +
    (signal.independentAuditabilityScore ?? 0) * 0.18 +
    (signal.reversibleDeploymentScore ?? 0) * 0.16 +
    (signal.distributedLegitimacyScore ?? 0) * 0.14
  );

  return {
    powerLimitingScore: Number(score.toFixed(3)),
    powerBand: score >= 0.75 ? "power-limited" : score >= 0.55 ? "adequate" : score >= 0.35 ? "fragile" : "power-limits-broken",
    requiredAction:
      score >= 0.75
        ? "continue-power-limited-operation"
        : score >= 0.55
          ? "tighten-authority-bounds"
          : score >= 0.35
            ? "restrict-authority-until-controls-improve"
            : "freeze-and-restore-power-limiting-constraints"
  };
}

export function modelPostInfrastructureSurvivability(signal = {}) {
  const score = clamp(
    (signal.safeTransitionAwayScore ?? 0) * 0.26 +
    (signal.communityResilienceRetentionScore ?? 0) * 0.24 +
    (signal.institutionIndependentCapabilityScore ?? 0) * 0.24 +
    (signal.governanceDecommissioningSurvivalScore ?? 0) * 0.18 +
    (signal.postUseTrustContinuityScore ?? 0) * 0.08
  );

  return {
    postInfrastructureScore: Number(score.toFixed(3)),
    postInfrastructureBand: score >= 0.75 ? "post-infrastructure-survivable" : score >= 0.55 ? "adequate" : score >= 0.35 ? "fragile" : "post-infrastructure-unsafe",
    requiredAction:
      score >= 0.75
        ? "continue-post-infrastructure-survivability-monitoring"
        : score >= 0.55
          ? "improve-transition-away-capability"
          : score >= 0.35
            ? "restrict-until-decommissioning-is-survivable"
            : "freeze-and-build-post-platform-survivability"
  };
}

export function recommendExistentialSafetyPosture(input = {}) {
  const irreversibility = modelIrreversibilityRisk(input.irreversibility);
  const selfSufficiency = preserveCivicSelfSufficiency(input.selfSufficiency);
  const failure = modelFailureSurvivability(input.failure);
  const monopoly = protectAntiMonopolyCoordination(input.monopoly);
  const reversibility = assessReversibleInfrastructure(input.reversibility);
  const coupling = analyzeCivilizationalCoupling(input.coupling);
  const redundancy = preserveRedundantSocietalCapability(input.redundancy);
  const powerLimits = enforcePowerLimitingPrinciples(input.powerLimits);
  const postInfrastructure = modelPostInfrastructureSurvivability(input.postInfrastructure);
  const hardStop =
    irreversibility.irreversibilityBand === "irreversible-dependency" ||
    selfSufficiency.selfSufficiencyBand === "self-sufficiency-collapsed" ||
    failure.survivabilityBand === "unsafe-failure" ||
    monopoly.monopolyBand === "coordination-monopoly" ||
    reversibility.reversibilityBand === "non-reversible" ||
    coupling.couplingBand === "civilization-scale-coupling" ||
    redundancy.redundancyBand === "redundancy-collapsed" ||
    powerLimits.powerBand === "power-limits-broken" ||
    postInfrastructure.postInfrastructureBand === "post-infrastructure-unsafe";
  const riskScore = clamp(
    irreversibility.irreversibilityRisk * 0.13 +
    (1 - selfSufficiency.selfSufficiencyScore) * 0.11 +
    failure.failureSurvivabilityRisk * 0.12 +
    monopoly.monopolyRisk * 0.12 +
    (1 - reversibility.reversibilityScore) * 0.11 +
    coupling.couplingRisk * 0.12 +
    (1 - redundancy.redundancyScore) * 0.1 +
    (1 - powerLimits.powerLimitingScore) * 0.1 +
    (1 - postInfrastructure.postInfrastructureScore) * 0.09
  );

  return {
    posture: hardStop
      ? "existential-safety-freeze"
      : riskScore >= 0.4
        ? "restrict-and-restore-societal-self-sufficiency"
        : riskScore >= 0.22
          ? "heightened-irreversibility-watch"
          : "continue-removable-resilience-support",
    riskScore: Number(riskScore.toFixed(3)),
    irreversibility,
    selfSufficiency,
    failure,
    monopoly,
    reversibility,
    coupling,
    redundancy,
    powerLimits,
    postInfrastructure,
    certificationBoundary: "existential-safety-limits-irreversibility-but-does-not-certify-readiness"
  };
}
