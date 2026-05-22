function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function daysBetween(older, newer) {
  const oldTime = new Date(older).getTime();
  const newTime = new Date(newer).getTime();
  if (!Number.isFinite(oldTime) || !Number.isFinite(newTime)) return 0;
  return Math.max((newTime - oldTime) / 86400000, 0);
}

export function scoreKnowledgeLimits(signal = {}) {
  const sampleLimitation = clamp(1 - (signal.sampleCoverageRate ?? 0));
  const sourceLimitation = clamp(1 - (signal.independentSourceCoverage ?? 0));
  const recencyLimitation = clamp((signal.daysSinceLastObservation ?? 0) / 30);
  const contradiction = clamp(signal.contradictionRate ?? 0);
  const modelError = clamp(signal.modelErrorRate ?? 0);
  const hiddenFragility = clamp(signal.unexplainedIncidentRate ?? 0);
  const uncertaintyScore = clamp(
    sampleLimitation * 0.18 +
    sourceLimitation * 0.18 +
    recencyLimitation * 0.14 +
    contradiction * 0.18 +
    modelError * 0.18 +
    hiddenFragility * 0.14
  );

  return {
    uncertaintyScore: Number(uncertaintyScore.toFixed(3)),
    knowledgeBand: uncertaintyScore >= 0.65 ? "severely-incomplete" : uncertaintyScore >= 0.4 ? "incomplete" : uncertaintyScore >= 0.2 ? "limited" : "adequate-for-observation",
    limitations: {
      sampleLimitation: Number(sampleLimitation.toFixed(3)),
      sourceLimitation: Number(sourceLimitation.toFixed(3)),
      recencyLimitation: Number(recencyLimitation.toFixed(3)),
      contradiction: Number(contradiction.toFixed(3)),
      modelError: Number(modelError.toFixed(3)),
      hiddenFragility: Number(hiddenFragility.toFixed(3))
    }
  };
}

export function ageMemoryConfidence(records = [], asOfDate = new Date().toISOString()) {
  const agedRecords = records.map((record) => {
    const ageDays = daysBetween(record.observedAt ?? record.date, asOfDate);
    const recencyWeight = clamp(Math.exp(-ageDays / 45));
    const recurrenceBoost = clamp((record.recurrenceCount ?? 1) / 6) * 0.2;
    const contradictionPenalty = clamp(record.contradictionRate ?? 0) * 0.35;
    const stalePenalty = ageDays > 60 ? 0.2 : ageDays > 30 ? 0.1 : 0;
    const effectiveConfidence = clamp((record.confidence ?? 0.5) * recencyWeight + recurrenceBoost - contradictionPenalty - stalePenalty);

    return {
      ...record,
      ageDays: Number(ageDays.toFixed(1)),
      recencyWeight: Number(recencyWeight.toFixed(3)),
      effectiveConfidence: Number(effectiveConfidence.toFixed(3))
    };
  });

  return {
    records: agedRecords,
    aggregateConfidence: Number(average(agedRecords.map((record) => record.effectiveConfidence)).toFixed(3)),
    staleRecordCount: agedRecords.filter((record) => record.ageDays > 60).length,
    contradictionRecordCount: agedRecords.filter((record) => (record.contradictionRate ?? 0) >= 0.35).length
  };
}

export function detectHistoricalOverconfidence(signal = {}) {
  const indicators = [];

  if ((signal.historicalConfidence ?? 0) >= 0.8 && (signal.recentContradictionRate ?? 0) >= 0.25) indicators.push("confidence-contradicted-by-recent-field-truth");
  if ((signal.repeatedPatternCount ?? 0) >= 8 && (signal.independentValidationRate ?? 1) < 0.6) indicators.push("pattern-repetition-without-independent-validation");
  if ((signal.chronicRiskKnownDays ?? 0) >= 30 && (signal.operationalRestrictionLevel ?? "restricted") === "normal") indicators.push("chronic-risk-normalized");
  if ((signal.memoryUsedAsCertificationEvidence ?? false)) indicators.push("memory-misused-as-certification");
  if ((signal.governanceReviewCadenceDays ?? 0) > 14 && (signal.familiarityWithRegion ?? 0) >= 0.75) indicators.push("familiarity-driven-governance-complacency");
  if ((signal.stabilityTrendScore ?? 0) >= 0.85 && (signal.hiddenAnomalyRate ?? 0) >= 0.15) indicators.push("misleading-stability-trend");

  return {
    indicators,
    overconfidenceBand: indicators.length >= 4 ? "critical" : indicators.length >= 2 ? "serious" : indicators.length === 1 ? "watch" : "clear",
    requiredAction:
      indicators.length >= 4
        ? "freeze-certainty-claims-and-reopen-review"
        : indicators.length >= 2
          ? "downgrade-confidence-and-increase-validation"
          : indicators.length === 1
            ? "mark-confidence-conditional"
            : "continue-humility-monitoring"
  };
}

export function compareOperationalPerspectives(perspectives = {}) {
  const keys = ["operator", "responder", "telemetry", "replay", "governance", "telecom"];
  const values = keys.map((key) => perspectives[key]).filter((value) => typeof value === "number").map((value) => clamp(value));
  const mean = average(values);
  const disagreement = values.length ? average(values.map((value) => Math.abs(value - mean))) : 1;
  const missingSources = keys.filter((key) => typeof perspectives[key] !== "number");
  const truthConfidence = clamp(mean - disagreement - missingSources.length * 0.05);

  return {
    truthConfidence: Number(truthConfidence.toFixed(3)),
    disagreementScore: Number(disagreement.toFixed(3)),
    missingSources,
    truthState: truthConfidence >= 0.75 && disagreement < 0.12 ? "corroborated" : truthConfidence >= 0.55 ? "partially-corroborated" : truthConfidence >= 0.35 ? "unresolved" : "conflicted",
    requiredAction:
      truthConfidence >= 0.75 && disagreement < 0.12
        ? "use-as-conditional-evidence"
        : truthConfidence >= 0.55
          ? "require-supervisor-context"
          : truthConfidence >= 0.35
            ? "hold-decision-pending-corroboration"
            : "do-not-use-as-operational-certainty"
  };
}

export function recommendEpistemicDecision(input = {}) {
  const knowledge = scoreKnowledgeLimits(input.knowledge);
  const memory = ageMemoryConfidence(input.memoryRecords ?? [], input.asOfDate);
  const overconfidence = detectHistoricalOverconfidence(input.overconfidence);
  const perspectives = compareOperationalPerspectives(input.perspectives);
  const humilityScore = clamp(
    knowledge.uncertaintyScore * 0.34 +
    (1 - memory.aggregateConfidence) * 0.2 +
    (overconfidence.overconfidenceBand === "critical" ? 0.25 : overconfidence.overconfidenceBand === "serious" ? 0.18 : overconfidence.overconfidenceBand === "watch" ? 0.08 : 0) +
    (1 - perspectives.truthConfidence) * 0.21
  );

  return {
    decision:
      overconfidence.requiredAction === "freeze-certainty-claims-and-reopen-review" || knowledge.knowledgeBand === "severely-incomplete"
        ? "freeze-certainty-claims"
        : perspectives.truthState === "conflicted"
          ? "restrict-to-uncertainty-first-decisions"
        : humilityScore >= 0.55
          ? "restrict-to-uncertainty-first-decisions"
          : humilityScore >= 0.2
            ? "allow-conditional-supervised-decisions"
            : "continue-controlled-observation",
    humilityScore: Number(humilityScore.toFixed(3)),
    knowledge,
    memory,
    overconfidence,
    perspectives,
    certificationBoundary: "non-certifying-epistemic-control"
  };
}
