const RECEIPT_CONFIDENCE = {
  delivered: 0.96,
  submitted: 0.72,
  pending: 0.52,
  delayed: 0.44,
  failed: 0.12,
  unknown: 0.25
};

function receiptKey(receipt) {
  return receipt.providerMessageId ?? `${receipt.provider}:${receipt.msisdn}:${receipt.sentAt}:${receipt.bodyHash}`;
}

export function reconcileTelecomReceipts(receipts, options = {}) {
  const toleranceMs = options.delayedDeliveryToleranceMs ?? 15 * 60 * 1000;
  const now = new Date(options.now ?? new Date()).getTime();
  const byKey = new Map();
  const providerStats = new Map();

  for (const receipt of receipts) {
    const key = receiptKey(receipt);
    const existing = byKey.get(key);
    const confidence = RECEIPT_CONFIDENCE[receipt.state] ?? RECEIPT_CONFIDENCE.unknown;
    const receivedAt = new Date(receipt.receivedAt ?? receipt.sentAt ?? now).getTime();
    const sentAt = new Date(receipt.sentAt ?? receipt.receivedAt ?? now).getTime();
    const delayed = receivedAt - sentAt > toleranceMs;

    const normalized = {
      ...receipt,
      key,
      confidence: delayed ? Math.min(confidence, RECEIPT_CONFIDENCE.delayed) : confidence,
      delayed,
      receivedAtMs: receivedAt
    };

    const stats = providerStats.get(receipt.provider) ?? { total: 0, delayed: 0, failed: 0, duplicates: 0 };
    stats.total += 1;
    if (delayed) stats.delayed += 1;
    if (receipt.state === "failed") stats.failed += 1;
    if (existing) stats.duplicates += 1;
    providerStats.set(receipt.provider, stats);

    if (!existing || normalized.confidence > existing.confidence || normalized.receivedAtMs > existing.receivedAtMs) {
      byKey.set(key, normalized);
    }
  }

  const reconciledReceipts = Array.from(byKey.values());
  const providerAnomalies = Array.from(providerStats.entries())
    .filter(([, stats]) => stats.total > 0 && (stats.delayed / stats.total > 0.3 || stats.failed / stats.total > 0.2 || stats.duplicates > 0))
    .map(([provider, stats]) => ({ provider, ...stats }));

  const averageConfidence = reconciledReceipts.length
    ? reconciledReceipts.reduce((sum, receipt) => sum + receipt.confidence, 0) / reconciledReceipts.length
    : 0;

  return {
    reconciledReceipts,
    duplicateSuppressedCount: receipts.length - reconciledReceipts.length,
    providerAnomalies,
    averageConfidence: Number(averageConfidence.toFixed(3))
  };
}

export function scoreTelecomHealth(receipts, heartbeats = []) {
  const reconciliation = reconcileTelecomReceipts(receipts);
  const heartbeatScores = heartbeats.map((heartbeat) => {
    if (heartbeat.state === "down") return 0;
    if (heartbeat.state === "degraded") return 0.45;
    return 1;
  });
  const heartbeatScore = heartbeatScores.length
    ? heartbeatScores.reduce((sum, score) => sum + score, 0) / heartbeatScores.length
    : 1;
  const anomalyPenalty = Math.min(0.35, reconciliation.providerAnomalies.length * 0.12);
  const healthScore = Math.max(0, reconciliation.averageConfidence * 0.65 + heartbeatScore * 0.35 - anomalyPenalty);

  return {
    healthScore: Number(healthScore.toFixed(3)),
    healthBand: healthScore >= 0.85 ? "healthy" : healthScore >= 0.65 ? "degraded" : healthScore >= 0.35 ? "severe" : "collapsed",
    receiptConfidence: reconciliation.averageConfidence,
    providerAnomalies: reconciliation.providerAnomalies
  };
}
