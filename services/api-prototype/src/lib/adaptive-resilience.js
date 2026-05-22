const BASE_CONFIDENCE_THRESHOLDS = {
  controlledExit: 0.9,
  stagedExit: 0.75,
  hold: 0.55
};

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

export function summarizeStabilityMemory(history = {}) {
  const recurrencePressure =
    (history.repeatedInstabilityCount ?? 0) * 0.04 +
    (history.recoveryRollbackCount ?? 0) * 0.08 +
    (history.oscillationCount ?? 0) * 0.06 +
    (history.chronicReplayDivergenceCount ?? 0) * 0.05 +
    (history.trustVolatilityCount ?? 0) * 0.05 +
    (history.operatorOverloadCycles ?? 0) * 0.04;

  const instabilityMemoryScore = clamp(recurrencePressure);

  return {
    instabilityMemoryScore: Number(instabilityMemoryScore.toFixed(3)),
    memoryBand: instabilityMemoryScore >= 0.7 ? "chronic" : instabilityMemoryScore >= 0.4 ? "volatile" : instabilityMemoryScore >= 0.15 ? "watch" : "stable"
  };
}

export function modelInstabilityPropagation(signal = {}) {
  const propagation = {
    telecomToOperator: clamp((1 - (signal.telecomHealthScore ?? 1)) * ((signal.operatorLoadPerOperator ?? 0) / 10)),
    replayToTrust: clamp((signal.replayDivergenceRate ?? 0) * 5 + (signal.unreconciledIncidentRate ?? 0) * 2),
    overloadToEscalation: clamp(Math.max(0, (signal.operatorLoadPerOperator ?? 0) - 6) / 8),
    scarcityToDisaster: clamp(Math.max(0, (signal.activeIncidents ?? 0) - (signal.availableResponders ?? 0)) / 50),
    syncToReplay: clamp(Math.max(0, (signal.queueReplayRate ?? 0) - 80) / 200)
  };
  const maxPropagation = Math.max(...Object.values(propagation));
  const averagePropagation = Object.values(propagation).reduce((sum, value) => sum + value, 0) / Object.values(propagation).length;

  return {
    propagation,
    maxPropagation: Number(maxPropagation.toFixed(3)),
    averagePropagation: Number(averagePropagation.toFixed(3)),
    propagationBand: maxPropagation >= 0.75 ? "critical" : maxPropagation >= 0.5 ? "high" : maxPropagation >= 0.25 ? "watch" : "contained"
  };
}

export function evolveConfidence(baseConfidence, context = {}) {
  const memory = summarizeStabilityMemory(context.history);
  const propagation = modelInstabilityPropagation(context.signal);
  const humanUncertaintyPenalty =
    (context.human?.fatigueRisk ?? 0) * 0.08 +
    (context.human?.situationalConfusion ?? 0) * 0.1 +
    (context.human?.overconfidenceAfterRecovery ?? 0) * 0.07 +
    (context.human?.escalationReluctance ?? 0) * 0.05;
  const recurrencePenalty = memory.instabilityMemoryScore * 0.18;
  const propagationPenalty = propagation.maxPropagation * 0.14;
  const oscillationPenalty = (context.history?.oscillationCount ?? 0) > 2 ? 0.08 : 0;

  const score = clamp(baseConfidence - humanUncertaintyPenalty - recurrencePenalty - propagationPenalty - oscillationPenalty);

  return {
    score: Number(score.toFixed(3)),
    band: score >= 0.9 ? "ready" : score >= 0.75 ? "cautious" : score >= 0.55 ? "unstable" : "unsafe",
    memory,
    propagation,
    penalties: {
      humanUncertaintyPenalty: Number(humanUncertaintyPenalty.toFixed(3)),
      recurrencePenalty: Number(recurrencePenalty.toFixed(3)),
      propagationPenalty: Number(propagationPenalty.toFixed(3)),
      oscillationPenalty: Number(oscillationPenalty.toFixed(3))
    }
  };
}

export function calculateAdaptiveRecoveryPolicy(convergenceResult, context = {}) {
  const evolved = evolveConfidence(convergenceResult.convergenceConfidence.score, {
    signal: context.signal,
    history: context.history,
    human: context.human
  });
  const conservatism = clamp(
    evolved.memory.instabilityMemoryScore * 0.4 +
    evolved.propagation.maxPropagation * 0.35 +
    (context.human?.fatigueRisk ?? 0) * 0.15 +
    (convergenceResult.convergence.unresolvedCriticalRisks > 0 ? 0.3 : 0)
  );
  const dynamicThresholds = {
    controlledExit: Number(clamp(BASE_CONFIDENCE_THRESHOLDS.controlledExit + conservatism * 0.08, 0, 0.98).toFixed(3)),
    stagedExit: Number(clamp(BASE_CONFIDENCE_THRESHOLDS.stagedExit + conservatism * 0.1, 0, 0.92).toFixed(3)),
    hold: Number(clamp(BASE_CONFIDENCE_THRESHOLDS.hold + conservatism * 0.12, 0, 0.82).toFixed(3))
  };
  const stabilizationMultiplier = Number((1 + conservatism * 0.75).toFixed(2));

  return {
    evolvedConfidence: evolved,
    dynamicThresholds,
    stabilizationMultiplier,
    conservatism: Number(conservatism.toFixed(3))
  };
}

export function recommendAdaptiveRecovery(convergenceResult, context = {}) {
  const policy = calculateAdaptiveRecoveryPolicy(convergenceResult, context);
  const score = policy.evolvedConfidence.score;
  const hasCriticalRisks = convergenceResult.convergence.unresolvedCriticalRisks > 0;

  if (hasCriticalRisks || score < policy.dynamicThresholds.hold) {
    return {
      action: "persist-degraded-or-rollback",
      reason: "Adaptive confidence is below hold threshold or critical risks remain.",
      policy
    };
  }

  if (score < policy.dynamicThresholds.stagedExit || convergenceResult.recovery.recoveryState !== "ready-for-controlled-exit") {
    return {
      action: "continue-supervised-degraded-recovery",
      reason: "System is not stable enough for partial restoration.",
      policy
    };
  }

  if (score < policy.dynamicThresholds.controlledExit) {
    return {
      action: "safe-partial-recovery",
      reason: "Confidence supports constrained recovery but not full normalization.",
      allowedRestoration: ["read-only-timeline", "supervised-dispatch", "limited-sms-normalization"],
      policy
    };
  }

  return {
    action: "adaptive-controlled-exit",
    reason: "Adaptive confidence is sufficient for controlled restoration.",
    policy
  };
}
