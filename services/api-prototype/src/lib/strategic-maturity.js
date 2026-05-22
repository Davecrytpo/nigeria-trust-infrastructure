function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

export function analyzeLongHorizonResilience(history = {}) {
  const weeksObserved = Math.max(history.weeksObserved ?? 1, 1);
  const telecomVolatility = clamp((history.telecomDegradedDays ?? 0) / (weeksObserved * 7));
  const overloadPersistence = clamp((history.operatorOverloadHours ?? 0) / (weeksObserved * 7 * 24));
  const disasterRecurrence = clamp((history.disasterModeActivations ?? 0) / weeksObserved / 2);
  const responderFatigue = clamp((history.responderDropoutRate ?? 0) + (history.avgResponderHoursPerWeek ?? 0) / 80);
  const replayChronicity = clamp((history.replayDivergenceEvents ?? 0) / weeksObserved / 20);
  const institutionalDrift = clamp(1 - (history.institutionalAcknowledgmentRate ?? 1));

  const chronicRiskScore =
    telecomVolatility * 0.18 +
    overloadPersistence * 0.18 +
    disasterRecurrence * 0.16 +
    responderFatigue * 0.16 +
    replayChronicity * 0.16 +
    institutionalDrift * 0.16;

  return {
    chronicRiskScore: Number(chronicRiskScore.toFixed(3)),
    chronicRiskBand: chronicRiskScore >= 0.7 ? "critical" : chronicRiskScore >= 0.45 ? "high" : chronicRiskScore >= 0.2 ? "watch" : "stable",
    components: {
      telecomVolatility: Number(telecomVolatility.toFixed(3)),
      overloadPersistence: Number(overloadPersistence.toFixed(3)),
      disasterRecurrence: Number(disasterRecurrence.toFixed(3)),
      responderFatigue: Number(responderFatigue.toFixed(3)),
      replayChronicity: Number(replayChronicity.toFixed(3)),
      institutionalDrift: Number(institutionalDrift.toFixed(3))
    }
  };
}

export function evaluateOperationalTrustDurability(signal = {}) {
  const responderReliability = clamp(signal.responderReliabilityTrend ?? 0.8);
  const operatorConfidence = clamp(signal.operatorConfidenceTrend ?? 0.8);
  const institutionalConsistency = clamp(signal.institutionalParticipationConsistency ?? 0.8);
  const falseReportPressure = clamp(signal.recurringFalseReportRegionRate ?? 0);
  const chronicZoneInstability = clamp(signal.chronicInstabilityZoneRate ?? 0);
  const trustVolatility = clamp(signal.trustVolatilityRate ?? 0);

  const durabilityScore = clamp(
    responderReliability * 0.24 +
    operatorConfidence * 0.2 +
    institutionalConsistency * 0.22 +
    (1 - falseReportPressure) * 0.12 +
    (1 - chronicZoneInstability) * 0.12 +
    (1 - trustVolatility) * 0.1
  );

  return {
    durabilityScore: Number(durabilityScore.toFixed(3)),
    durabilityBand: durabilityScore >= 0.85 ? "durable" : durabilityScore >= 0.68 ? "strained" : durabilityScore >= 0.5 ? "fragile" : "eroding",
    requiredAction:
      durabilityScore >= 0.85
        ? "maintain-monitoring"
        : durabilityScore >= 0.68
          ? "increase-review-cadence"
          : durabilityScore >= 0.5
            ? "restrict-expansion-and-rebuild-trust"
            : "pause-expansion-and-governance-review"
  };
}

export function scoreInstitutionalReliability(institution = {}) {
  const acknowledgment = clamp(institution.acknowledgmentRate ?? 0.7);
  const handoffCompletion = clamp(institution.handoffCompletionRate ?? 0.7);
  const communicationContinuity = clamp(institution.communicationContinuity ?? 0.7);
  const authorityClarity = clamp(institution.authorityClarity ?? 0.7);
  const overloadPenalty = clamp(institution.overloadRate ?? 0) * 0.22;
  const professionalismPenalty = clamp(institution.professionalismIncidentRate ?? 0) * 0.18;

  const reliabilityScore = clamp(
    acknowledgment * 0.24 +
    handoffCompletion * 0.24 +
    communicationContinuity * 0.2 +
    authorityClarity * 0.16 +
    (1 - overloadPenalty - professionalismPenalty) * 0.16
  );

  return {
    reliabilityScore: Number(reliabilityScore.toFixed(3)),
    reliabilityBand: reliabilityScore >= 0.85 ? "strong" : reliabilityScore >= 0.68 ? "usable" : reliabilityScore >= 0.5 ? "weak" : "unreliable",
    integrationMode:
      reliabilityScore >= 0.85
        ? "direct-handoff"
        : reliabilityScore >= 0.68
          ? "supervised-handoff"
          : reliabilityScore >= 0.5
            ? "fallback-only"
            : "do-not-depend"
  };
}

export function modelRegionalDeploymentReadiness(regions = []) {
  const evaluatedRegions = regions.map((region) => {
    const telecom = clamp(region.telecomReliability ?? 0.7);
    const institutional = clamp(region.institutionalCapacity ?? 0.7);
    const responderDensity = clamp(region.responderDensity ?? 0.7);
    const operatorCoverage = clamp(region.operatorCoverage ?? 0.7);
    const governanceReadiness = clamp(region.governanceReadiness ?? 0.7);
    const degradationDiversityPenalty = clamp(region.degradationDiversity ?? 0) * 0.16;
    const readinessScore = clamp(
      telecom * 0.18 +
      institutional * 0.2 +
      responderDensity * 0.18 +
      operatorCoverage * 0.18 +
      governanceReadiness * 0.18 +
      (1 - degradationDiversityPenalty) * 0.08
    );

    return {
      ...region,
      readinessScore: Number(readinessScore.toFixed(3)),
      readinessBand: readinessScore >= 0.82 ? "pilot-ready" : readinessScore >= 0.65 ? "limited-pilot" : readinessScore >= 0.5 ? "shadow-only" : "not-ready",
      recommendedMode:
        readinessScore >= 0.82
          ? "controlled-live-pilot"
          : readinessScore >= 0.65
            ? "limited-hours-supervised-pilot"
            : readinessScore >= 0.5
              ? "shadow-mode-and-drills"
              : "governance-and-capacity-building"
    };
  });

  return {
    regions: evaluatedRegions,
    portfolioReadinessScore: Number(average(evaluatedRegions.map((region) => region.readinessScore)).toFixed(3)),
    blockedRegions: evaluatedRegions.filter((region) => region.readinessBand === "not-ready" || region.readinessBand === "shadow-only").map((region) => region.id)
  };
}

export function recommendGovernancePosture(inputs = {}) {
  const longHorizon = analyzeLongHorizonResilience(inputs.history);
  const trust = evaluateOperationalTrustDurability(inputs.trust);
  const institutions = (inputs.institutions ?? []).map(scoreInstitutionalReliability);
  const weakestInstitutionScore = institutions.length ? Math.min(...institutions.map((item) => item.reliabilityScore)) : 1;
  const risk = clamp(
    longHorizon.chronicRiskScore * 0.34 +
    (1 - trust.durabilityScore) * 0.32 +
    (1 - weakestInstitutionScore) * 0.22 +
    (inputs.governance?.auditBacklogRate ?? 0) * 0.12
  );

  return {
    governanceRiskScore: Number(risk.toFixed(3)),
    governancePosture: risk >= 0.7 ? "freeze-expansion" : risk >= 0.45 ? "restricted-expansion" : risk >= 0.25 ? "supervised-growth" : "maintain-controlled-pilot",
    longHorizon,
    trust,
    institutions
  };
}
