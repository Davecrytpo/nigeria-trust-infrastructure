export function scoreTrustAttackRisk(signal) {
  const weightedScore =
    (signal.fakeVerificationAttempts ?? 0) * 18 +
    (signal.sharedDocumentReuseCount ?? 0) * 16 +
    (signal.coordinatedIncidentReports ?? 0) * 12 +
    (signal.trustScoreJumpCount ?? 0) * 14 +
    (signal.responderCollusionSignals ?? 0) * 20 +
    (signal.duressAbuseSignals ?? 0) * 15 +
    (signal.spamBurstCount ?? 0) * 10;

  const normalizedScore = Math.min(100, weightedScore);

  return {
    riskScore: normalizedScore,
    riskBand: normalizedScore >= 75 ? "critical" : normalizedScore >= 45 ? "high" : normalizedScore >= 20 ? "watch" : "normal",
    requiredAction:
      normalizedScore >= 75
        ? "freeze-and-supervisor-review"
        : normalizedScore >= 45
          ? "manual-trust-review"
          : normalizedScore >= 20
            ? "monitor"
            : "none"
  };
}

export function calculateTrustConfidence(profile = {}, anomaly = {}) {
  const baseTrust = Math.max(0, Math.min(1, (profile.trustScore ?? 50) / 100));
  const verificationWeight = profile.verificationStatus === "verified" ? 0.18 : profile.verificationStatus === "pending" ? 0.05 : -0.2;
  const reliabilityWeight = Math.max(0, Math.min(1, profile.reliabilityRate ?? 0.75)) * 0.22;
  const anomalyPenalty =
    (anomaly.telecomUncertainty ?? 0) * 0.08 +
    (anomaly.replayDivergence ?? 0) * 0.12 +
    (anomaly.spamPressure ?? 0) * 0.18 +
    (anomaly.collusionRisk ?? 0) * 0.22;

  const confidence = Math.max(0, Math.min(1, baseTrust * 0.6 + verificationWeight + reliabilityWeight - anomalyPenalty));

  return {
    confidence: Number(confidence.toFixed(3)),
    confidenceBand: confidence >= 0.85 ? "high" : confidence >= 0.65 ? "partial" : confidence >= 0.4 ? "low" : "unsafe",
    coordinationMode:
      confidence >= 0.85
        ? "normal-dispatch"
        : confidence >= 0.65
          ? "supervised-dispatch"
          : confidence >= 0.4
            ? "institutional-only"
            : "blocked"
  };
}
