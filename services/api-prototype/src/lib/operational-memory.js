function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function rate(count, denominator) {
  return denominator > 0 ? clamp(count / denominator) : 0;
}

export function accumulateOperationalReality(records = []) {
  const observedDays = new Set(records.map((record) => record.date).filter(Boolean)).size || Math.max(records.length, 1);
  const telecomDegraded = records.filter((record) => record.telecomState === "degraded" || record.telecomState === "collapsed").length;
  const responderAbandonmentRates = records.map((record) => record.responderAbandonmentRate ?? 0);
  const operatorFatigueRates = records.map((record) => record.operatorFatigueScore ?? 0);
  const escalationInconsistencyRates = records.map((record) => record.escalationInconsistencyRate ?? 0);
  const degradedPersistenceHours = records.reduce((sum, record) => sum + (record.degradedModeHours ?? 0), 0);
  const syncDriftEvents = records.reduce((sum, record) => sum + (record.syncDriftEvents ?? 0), 0);
  const trustVolatilityRates = records.map((record) => record.trustVolatilityRate ?? 0);
  const governanceFailures = records.reduce((sum, record) => sum + (record.governanceReviewMissed ? 1 : 0), 0);

  return {
    observedDays,
    sampleCount: records.length,
    recurrence: {
      telecomInstabilityRate: Number(rate(telecomDegraded, records.length).toFixed(3)),
      responderAbandonmentTrend: Number(average(responderAbandonmentRates).toFixed(3)),
      operatorFatigueTrend: Number(average(operatorFatigueRates).toFixed(3)),
      escalationInconsistencyTrend: Number(average(escalationInconsistencyRates).toFixed(3)),
      degradedPersistenceHours: Number(degradedPersistenceHours.toFixed(2)),
      syncDriftFrequency: Number((syncDriftEvents / observedDays).toFixed(3)),
      trustVolatilityTrend: Number(average(trustVolatilityRates).toFixed(3)),
      governanceMissRate: Number(rate(governanceFailures, records.length).toFixed(3))
    }
  };
}

export function analyzeRealityModelDivergence(expected = {}, observed = {}) {
  const drift = {
    smsLatency: clamp(((observed.p95SmsLatencySeconds ?? 0) - (expected.p95SmsLatencySeconds ?? 0)) / 600),
    responderReliability: clamp((expected.responderReliability ?? 1) - (observed.responderReliability ?? 1)),
    operatorOverload: clamp((observed.operatorOverloadRate ?? 0) - (expected.operatorOverloadRate ?? 0)),
    telecomReliability: clamp((expected.telecomReliability ?? 1) - (observed.telecomReliability ?? 1)),
    governanceReliability: clamp((expected.governanceReviewCompletionRate ?? 1) - (observed.governanceReviewCompletionRate ?? 1)),
    trustStability: clamp((expected.trustStability ?? 1) - (observed.trustStability ?? 1)),
    recoveryQuality: clamp((expected.recoverySuccessRate ?? 1) - (observed.recoverySuccessRate ?? 1))
  };
  const maxDrift = Math.max(...Object.values(drift));
  const meanDrift = average(Object.values(drift));

  return {
    drift,
    maxDrift: Number(maxDrift.toFixed(3)),
    meanDrift: Number(meanDrift.toFixed(3)),
    driftBand: maxDrift >= 0.6 ? "model-invalid" : maxDrift >= 0.35 ? "material-drift" : maxDrift >= 0.15 ? "watch-drift" : "aligned",
    requiredAction:
      maxDrift >= 0.6
        ? "suspend-assumption-driven-decisions"
        : maxDrift >= 0.35
          ? "recalibrate-model-before-expansion"
          : maxDrift >= 0.15
            ? "increase-reality-sampling"
            : "continue-observation"
  };
}

export function buildInstabilityFingerprints(records = []) {
  const regionMap = new Map();
  const providerMap = new Map();
  const institutionMap = new Map();

  for (const record of records) {
    const region = record.regionId ?? "unknown-region";
    const provider = record.telecomProvider ?? "unknown-provider";
    const institution = record.institutionId ?? "unknown-institution";

    if (!regionMap.has(region)) regionMap.set(region, { id: region, count: 0, degradedHours: 0, syncDrift: 0, trustVolatility: [] });
    if (!providerMap.has(provider)) providerMap.set(provider, { id: provider, count: 0, degradedCount: 0, delayedReceiptCount: 0 });
    if (!institutionMap.has(institution)) institutionMap.set(institution, { id: institution, count: 0, nonResponseCount: 0, handoffFailures: 0 });

    const regionEntry = regionMap.get(region);
    regionEntry.count += 1;
    regionEntry.degradedHours += record.degradedModeHours ?? 0;
    regionEntry.syncDrift += record.syncDriftEvents ?? 0;
    regionEntry.trustVolatility.push(record.trustVolatilityRate ?? 0);

    const providerEntry = providerMap.get(provider);
    providerEntry.count += 1;
    if (record.telecomState === "degraded" || record.telecomState === "collapsed") providerEntry.degradedCount += 1;
    if (record.delayedReceiptAnomaly) providerEntry.delayedReceiptCount += 1;

    const institutionEntry = institutionMap.get(institution);
    institutionEntry.count += 1;
    if (record.institutionNonResponse) institutionEntry.nonResponseCount += 1;
    institutionEntry.handoffFailures += record.institutionHandoffFailures ?? 0;
  }

  return {
    chronicRegions: [...regionMap.values()].map((region) => ({
      id: region.id,
      chronicityScore: Number(clamp((region.degradedHours / 24) * 0.35 + (region.syncDrift / 20) * 0.35 + average(region.trustVolatility) * 0.3).toFixed(3))
    })).filter((region) => region.chronicityScore >= 0.25),
    telecomProviders: [...providerMap.values()].map((provider) => ({
      id: provider.id,
      recurrenceScore: Number(clamp(rate(provider.degradedCount, provider.count) * 0.65 + rate(provider.delayedReceiptCount, provider.count) * 0.35).toFixed(3))
    })),
    institutions: [...institutionMap.values()].map((institution) => ({
      id: institution.id,
      reliabilityRisk: Number(clamp(rate(institution.nonResponseCount, institution.count) * 0.65 + (institution.handoffFailures / Math.max(institution.count * 5, 1)) * 0.35).toFixed(3))
    }))
  };
}

export function detectFalseNormalization(memory = {}) {
  const recurrence = memory.recurrence ?? {};
  const indicators = [];

  if ((recurrence.degradedPersistenceHours ?? 0) >= 12 && (memory.reportedOperationalStatus ?? "normal") === "normal") indicators.push("degraded-condition-normalized");
  if ((recurrence.governanceMissRate ?? 0) >= 0.2 && (memory.governanceConfidence ?? 1) >= 0.75) indicators.push("governance-fatigue-hidden");
  if ((recurrence.trustVolatilityTrend ?? 0) >= 0.35 && (memory.trustNarrative ?? "uncertain") === "stable") indicators.push("silent-trust-erosion");
  if ((recurrence.telecomInstabilityRate ?? 0) >= 0.35 && (memory.telecomConfidence ?? 1) >= 0.75) indicators.push("telecom-instability-minimized");
  if ((recurrence.operatorFatigueTrend ?? 0) >= 0.4 && (memory.staffingNarrative ?? "strained") === "healthy") indicators.push("operator-fatigue-normalized");

  return {
    indicators,
    normalizationBand: indicators.length >= 4 ? "critical" : indicators.length >= 2 ? "serious" : indicators.length === 1 ? "watch" : "clear",
    requiredAction:
      indicators.length >= 4
        ? "freeze-normalization-and-review-governance"
        : indicators.length >= 2
          ? "hold-restricted-posture-and-investigate"
          : indicators.length === 1
            ? "increase-observation-and-disclose-uncertainty"
            : "continue-observation"
  };
}

export function recommendOperationalMemoryPosture(input = {}) {
  const memory = accumulateOperationalReality(input.records ?? []);
  const divergence = analyzeRealityModelDivergence(input.expected, input.observed);
  const fingerprints = buildInstabilityFingerprints(input.records ?? []);
  const normalization = detectFalseNormalization({ ...memory, ...(input.narrative ?? {}) });
  const uncertaintyScore = clamp(
    divergence.maxDrift * 0.36 +
    (normalization.normalizationBand === "critical" ? 0.3 : normalization.normalizationBand === "serious" ? 0.2 : normalization.normalizationBand === "watch" ? 0.1 : 0) +
    Math.min(fingerprints.chronicRegions.length / 5, 1) * 0.18 +
    memory.recurrence.governanceMissRate * 0.16
  );

  return {
    posture:
      uncertaintyScore >= 0.65 || divergence.requiredAction === "suspend-assumption-driven-decisions"
        ? "freeze-assumption-driven-operations"
        : uncertaintyScore >= 0.4
          ? "restricted-reality-learning"
          : uncertaintyScore >= 0.2
            ? "supervised-memory-accumulation"
            : "continue-controlled-observation",
    uncertaintyScore: Number(uncertaintyScore.toFixed(3)),
    memory,
    divergence,
    fingerprints,
    normalization
  };
}
