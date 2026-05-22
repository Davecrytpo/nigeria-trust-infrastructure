function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

export function modelCivilizationalStability(signal = {}) {
  const stabilizing = clamp(
    (signal.communityStabilizationScore ?? 0) * 0.18 +
    (signal.panicReductionScore ?? 0) * 0.16 +
    (signal.coordinationResilienceScore ?? 0) * 0.18 +
    (signal.institutionalTrustStrengtheningScore ?? 0) * 0.16 +
    (signal.civicContinuityScore ?? 0) * 0.16 +
    (signal.socialCohesionScore ?? 0) * 0.16
  );
  const destabilizing = clamp(
    (signal.fearAmplificationRate ?? 0) * 0.18 +
    (signal.dependencyFragilityIncrease ?? 0) * 0.18 +
    (signal.authorityCentralizationPressure ?? 0) * 0.18 +
    (signal.informalResilienceWeakeningRate ?? 0) * 0.18 +
    (signal.publicAnxietyRate ?? 0) * 0.14 +
    (signal.coordinationMonocultureRisk ?? 0) * 0.14
  );
  const netStability = clamp(stabilizing - destabilizing, -1, 1);

  return {
    stabilizingScore: Number(stabilizing.toFixed(3)),
    destabilizingScore: Number(destabilizing.toFixed(3)),
    netStability: Number(netStability.toFixed(3)),
    stabilityBand: netStability < -0.25 ? "destabilizing" : netStability < 0 ? "fragile" : netStability < 0.25 ? "neutral" : "stabilizing",
    requiredAction:
      netStability < -0.25
        ? "pause-and-redesign-for-social-stability"
        : netStability < 0
          ? "restrict-and-monitor-social-effects"
          : netStability < 0.25
            ? "continue-with-civic-stability-watch"
            : "continue-resilience-amplifying-operation"
  };
}

export function modelMassPanicInformationDynamics(signal = {}) {
  const risk = clamp(
    (signal.rumorPropagationRate ?? 0) * 0.18 +
    (signal.misinformationAmplificationRate ?? 0) * 0.18 +
    (signal.panicEscalationLoopRate ?? 0) * 0.18 +
    (signal.falseAlertContagionRate ?? 0) * 0.16 +
    (signal.trustCollapseCascadeRisk ?? 0) * 0.16 +
    (signal.institutionalConfusionRate ?? 0) * 0.14
  );

  return {
    panicInformationRisk: Number(risk.toFixed(3)),
    panicBand: risk >= 0.65 ? "panic-cascade-risk" : risk >= 0.4 ? "information-fragile" : risk >= 0.2 ? "watch" : "contained",
    requiredAction:
      risk >= 0.65
        ? "activate-public-clarity-and-freeze-amplifying-flows"
        : risk >= 0.4
          ? "slow-public-notifications-and-add-verification"
          : risk >= 0.2
            ? "increase-rumor-monitoring-and-clarity"
            : "continue-information-stability-monitoring"
  };
}

export function balanceDependencyResilience(signal = {}) {
  const risk = clamp(
    (signal.overDependenceRate ?? 0) * 0.2 +
    (signal.localInitiativeReductionRate ?? 0) * 0.18 +
    (signal.behavioralPassivityRate ?? 0) * 0.16 +
    (signal.institutionalRelianceImbalance ?? 0) * 0.18 +
    (signal.coordinationMonocultureRisk ?? 0) * 0.16 +
    (signal.communityFallbackWeakness ?? 0) * 0.12
  );

  return {
    dependencyBalanceRisk: Number(risk.toFixed(3)),
    dependencyBand: risk >= 0.65 ? "dependency-undermines-resilience" : risk >= 0.4 ? "dependency-fragile" : risk >= 0.2 ? "watch" : "resilience-balanced",
    requiredAction:
      risk >= 0.65
        ? "reduce-platform-dependence-and-restore-local-capacity"
        : risk >= 0.4
          ? "strengthen-community-fallbacks"
          : risk >= 0.2
            ? "monitor-dependency-balance"
            : "continue-resilience-balanced-operation"
  };
}

export function modelSocietalBehaviorAdaptation(signal = {}) {
  const risk = clamp(
    (signal.communityBehaviorDistortionRate ?? 0) * 0.16 +
    (signal.responderCultureDriftRate ?? 0) * 0.16 +
    (signal.governanceBehaviorShiftRate ?? 0) * 0.16 +
    (signal.operatorAuthorityPsychologyRisk ?? 0) * 0.18 +
    (signal.expectationNormalizationRisk ?? 0) * 0.18 +
    (signal.emergencyBehaviorDistortionRate ?? 0) * 0.16
  );

  return {
    adaptationRisk: Number(risk.toFixed(3)),
    adaptationBand: risk >= 0.65 ? "behavioral-distortion" : risk >= 0.4 ? "adaptation-fragile" : risk >= 0.2 ? "watch" : "healthy-adaptation",
    requiredAction:
      risk >= 0.65
        ? "pause-and-review-behavioral-effects"
        : risk >= 0.4
          ? "restrict-and-add-human-behavior-review"
          : risk >= 0.2
            ? "increase-behavioral-observation"
            : "continue-adaptation-monitoring"
  };
}

export function assessIntergenerationalLegitimacy(signal = {}) {
  const risk = clamp(
    (1 - clamp(signal.futureGenerationTrustScore ?? 0)) * 0.25 +
    (1 - clamp(signal.governanceUnderstandabilityOverTime ?? 0)) * 0.22 +
    (signal.civicNormAssumptionDriftRate ?? 0) * 0.2 +
    (signal.legitimacyPersistenceRisk ?? 0) * 0.18 +
    (signal.societalTransformationMismatch ?? 0) * 0.15
  );

  return {
    intergenerationalRisk: Number(risk.toFixed(3)),
    legitimacyBand: risk >= 0.65 ? "future-legitimacy-unsafe" : risk >= 0.4 ? "future-legitimacy-fragile" : risk >= 0.2 ? "watch" : "durable-legitimacy",
    requiredAction:
      risk >= 0.65
        ? "pause-and-renew-generational-legitimacy"
        : risk >= 0.4
          ? "run-intergenerational-review"
          : risk >= 0.2
            ? "increase-youth-and-future-civic-review"
            : "continue-generational-legitimacy-monitoring"
  };
}

export function modelInstitutionalInteractionDynamics(signal = {}) {
  const risk = clamp(
    (signal.institutionalDependencyRate ?? 0) * 0.16 +
    (signal.institutionalComplacencyRate ?? 0) * 0.16 +
    (signal.interAgencyCompetitionRate ?? 0) * 0.16 +
    (signal.authorityConflictRate ?? 0) * 0.18 +
    (signal.governanceFragmentationRate ?? 0) * 0.18 +
    (signal.crisisCoordinationPoliticsRate ?? 0) * 0.16
  );

  return {
    institutionalInteractionRisk: Number(risk.toFixed(3)),
    interactionBand: risk >= 0.65 ? "institutional-conflict-risk" : risk >= 0.4 ? "institutional-fragile" : risk >= 0.2 ? "watch" : "cooperative",
    requiredAction:
      risk >= 0.65
        ? "freeze-institutional-expansion-and-mediate-authority"
        : risk >= 0.4
          ? "clarify-institutional-roles"
          : risk >= 0.2
            ? "monitor-institutional-interactions"
            : "continue-institutional-coordination"
  };
}

export function amplifyCivicResilience(signal = {}) {
  const score = clamp(
    (signal.localCoordinationStrengthening ?? 0) * 0.2 +
    (signal.communityInitiativeSupport ?? 0) * 0.18 +
    (signal.humanPreparednessImprovement ?? 0) * 0.18 +
    (signal.distributedResilienceIncrease ?? 0) * 0.2 +
    (signal.decentralizedProblemSolvingPreservation ?? 0) * 0.16 +
    (signal.localFallbackTrainingScore ?? 0) * 0.08
  );

  return {
    resilienceAmplificationScore: Number(score.toFixed(3)),
    amplificationBand: score >= 0.75 ? "strong-amplification" : score >= 0.55 ? "moderate-amplification" : score >= 0.35 ? "weak-amplification" : "not-amplifying",
    requiredAction:
      score >= 0.75
        ? "continue-resilience-amplification"
        : score >= 0.55
          ? "strengthen-local-capacity"
          : score >= 0.35
            ? "prioritize-community-preparedness"
            : "redesign-to-amplify-civic-resilience"
  };
}

export function containSystemicFailure(signal = {}) {
  const risk = clamp(
    (signal.infrastructureFailureDestabilizationRisk ?? 0) * 0.22 +
    (signal.degradedModePanicRisk ?? 0) * 0.18 +
    (signal.expectationCollapseDistrustRisk ?? 0) * 0.2 +
    (signal.institutionalDependencyCascadeRisk ?? 0) * 0.2 +
    (1 - clamp(signal.safeFailureModeScore ?? 0)) * 0.2
  );

  return {
    systemicFailureRisk: Number(risk.toFixed(3)),
    containmentBand: risk >= 0.65 ? "unsafe-systemic-failure-risk" : risk >= 0.4 ? "fragile-containment" : risk >= 0.2 ? "watch" : "contained",
    requiredAction:
      risk >= 0.65
        ? "freeze-and-build-safe-failure-containment"
        : risk >= 0.4
          ? "strengthen-failure-containment-before-expansion"
          : risk >= 0.2
            ? "test-safe-failure-modes"
            : "continue-containment-monitoring"
  };
}

export function recommendCivilizationalStabilityPosture(input = {}) {
  const stability = modelCivilizationalStability(input.stability);
  const panic = modelMassPanicInformationDynamics(input.panic);
  const dependency = balanceDependencyResilience(input.dependency);
  const behavior = modelSocietalBehaviorAdaptation(input.behavior);
  const intergenerational = assessIntergenerationalLegitimacy(input.intergenerational);
  const institutions = modelInstitutionalInteractionDynamics(input.institutions);
  const resilience = amplifyCivicResilience(input.resilience);
  const containment = containSystemicFailure(input.containment);
  const hardStop =
    stability.stabilityBand === "destabilizing" ||
    panic.panicBand === "panic-cascade-risk" ||
    dependency.dependencyBand === "dependency-undermines-resilience" ||
    behavior.adaptationBand === "behavioral-distortion" ||
    intergenerational.legitimacyBand === "future-legitimacy-unsafe" ||
    institutions.interactionBand === "institutional-conflict-risk" ||
    containment.containmentBand === "unsafe-systemic-failure-risk";
  const riskScore = clamp(
    Math.max(0, -stability.netStability) * 0.16 +
    panic.panicInformationRisk * 0.14 +
    dependency.dependencyBalanceRisk * 0.13 +
    behavior.adaptationRisk * 0.12 +
    intergenerational.intergenerationalRisk * 0.12 +
    institutions.institutionalInteractionRisk * 0.12 +
    (1 - resilience.resilienceAmplificationScore) * 0.09 +
    containment.systemicFailureRisk * 0.12
  );

  return {
    posture: hardStop
      ? "civilizational-stability-freeze"
      : riskScore >= 0.35
        ? "restrict-and-reinforce-societal-resilience"
        : riskScore >= 0.22
          ? "heightened-civilizational-watch"
          : "continue-resilience-amplifying-civic-operation",
    riskScore: Number(riskScore.toFixed(3)),
    stability,
    panic,
    dependency,
    behavior,
    intergenerational,
    institutions,
    resilience,
    containment,
    certificationBoundary: "civilizational-stability-guides-societal-impact-but-does-not-certify-readiness"
  };
}
