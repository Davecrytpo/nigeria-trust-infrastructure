import assert from "node:assert/strict";
import test from "node:test";
import { reconcileIncidentEvents, reconstructAuthoritativeTimeline } from "./lib/event-consistency.js";
import { reconcileTelecomReceipts, scoreTelecomHealth } from "./lib/telecom-receipts.js";
import { prioritizeIncidentQueue, summarizeOperatorLoad } from "./lib/operational-triage.js";
import { calculateTrustConfidence, scoreTrustAttackRisk } from "./lib/trust-risk.js";
import { buildContainmentPlan, evaluateDegradedModes } from "./lib/degraded-mode.js";
import {
  analyzeEmergentFailures,
  buildRecoveryPlan,
  buildTelemetrySnapshot,
  decideRecoveryAction,
  evaluateConvergenceScenario
} from "./lib/system-convergence.js";
import {
  calculateAdaptiveRecoveryPolicy,
  evolveConfidence,
  modelInstabilityPropagation,
  recommendAdaptiveRecovery,
  summarizeStabilityMemory
} from "./lib/adaptive-resilience.js";
import {
  analyzeLongHorizonResilience,
  evaluateOperationalTrustDurability,
  modelRegionalDeploymentReadiness,
  recommendGovernancePosture,
  scoreInstitutionalReliability
} from "./lib/strategic-maturity.js";
import {
  determineGovernanceAuthority,
  evaluateCivicTrustSafeguards,
  evaluateDeploymentGovernance,
  evaluateSafePilotGovernance,
  modelOperationalLiability,
  recommendPreDeploymentDecision
} from "./lib/civic-governance.js";
import {
  evaluateFieldSafetyConstraints,
  evaluateHumanFieldPreparation,
  evaluateLiveObservability,
  evaluatePilotScope,
  evaluateTelecomFieldValidation,
  recommendLimitedPilotDecision
} from "./lib/field-pilot.js";
import {
  determineCertificationState,
  discoverOperationalBlindSpots,
  evaluateGovernanceDurability,
  evaluateHumanFactorValidation,
  evaluateObservedFieldTruth
} from "./lib/precertification.js";
import {
  compareObservedToAssumptions,
  detectFalseConfidence,
  evaluateExperimentApproval,
  evaluateHumanChaos,
  evaluateOperationalFatigue,
  recommendRealityExperimentDecision
} from "./lib/reality-validation.js";
import {
  accumulateOperationalReality,
  analyzeRealityModelDivergence,
  buildInstabilityFingerprints,
  detectFalseNormalization,
  recommendOperationalMemoryPosture
} from "./lib/operational-memory.js";
import {
  ageMemoryConfidence,
  compareOperationalPerspectives,
  detectHistoricalOverconfidence,
  recommendEpistemicDecision,
  scoreKnowledgeLimits
} from "./lib/epistemic-resilience.js";
import {
  evaluateIncidentReviewCompleteness,
  evaluateLivePilotScope,
  recommendLiveOperationalizationDecision,
  scoreGovernanceFriction,
  scoreHumanOperationalBehavior,
  scoreLiveTelecomObservation
} from "./lib/live-operationalization.js";
import {
  assessContinuityResilience,
  detectChronicDegradedNormalization,
  modelHumanFatigueEvolution,
  modelOperationalDrift,
  modelTelecomEvolution,
  modelTrustErosion,
  recommendFieldEvolutionPosture,
  validateGovernanceDurability as validateFieldGovernanceDurability
} from "./lib/field-evolution.js";
import {
  assessCivicLegibility,
  buildAccountabilityTrace,
  buildCommunityTrustNotice,
  buildDecisionExplanation,
  compareConflictingReality,
  explainGovernanceAction,
  surfaceUncertainty
} from "./lib/civic-legibility.js";
import {
  assessOversightArchitecture,
  detectPowerConcentration,
  detectSurveillanceDrift,
  enforceRightsPreservation,
  modelPoliticalPressure,
  recommendCivicIntegrityPosture,
  resistGovernanceBypass
} from "./lib/civic-integrity.js";
import {
  analyzeDependencyFragility,
  assessInfrastructureMinimalism,
  evaluateEconomicSurvivability,
  evaluateSustainableGovernance,
  modelCommunityTrustEvolution,
  modelCulturalAdaptation,
  modelLongHorizonSustainability,
  modelOperatorGovernanceFatigue,
  modelRecoverySustainability,
  recommendCivicSustainabilityPosture
} from "./lib/civic-sustainability.js";
import {
  assessEvolutionaryOversight,
  checkSocietalAlignment,
  controlComplexityAccumulation,
  detectMissionDrift,
  detectPermanentEmergency,
  modelAdaptiveLegitimacy,
  preserveFoundingPrinciples,
  recommendAdaptiveLegitimacyPosture,
  restrainTechnologyExpansion
} from "./lib/adaptive-legitimacy.js";
import {
  amplifyCivicResilience,
  assessIntergenerationalLegitimacy,
  balanceDependencyResilience,
  containSystemicFailure,
  modelCivilizationalStability,
  modelInstitutionalInteractionDynamics,
  modelMassPanicInformationDynamics,
  modelSocietalBehaviorAdaptation,
  recommendCivilizationalStabilityPosture
} from "./lib/civilizational-stability.js";
import {
  analyzeCivilizationalCoupling,
  assessReversibleInfrastructure,
  enforcePowerLimitingPrinciples,
  modelFailureSurvivability,
  modelIrreversibilityRisk,
  modelPostInfrastructureSurvivability,
  preserveCivicSelfSufficiency,
  preserveRedundantSocietalCapability,
  protectAntiMonopolyCoordination,
  recommendExistentialSafetyPosture
} from "./lib/existential-safety.js";

test("event reconciliation suppresses duplicates and quarantines corrupt queue segments", () => {
  const result = reconcileIncidentEvents([
    { idempotencyKey: "evt-1", type: "dispatched", actor: "ops", clientAt: "2026-05-21T10:03:00Z" },
    { idempotencyKey: "evt-1", type: "dispatched", actor: "ops", clientAt: "2026-05-21T10:03:00Z", receivedAt: "2026-05-21T10:05:00Z" },
    { idempotencyKey: "evt-0", type: "created", actor: "resident", clientAt: "2026-05-21T10:01:00Z" },
    { idempotencyKey: "evt-bad", type: "acknowledged", actor: "responder", queueSegmentStatus: "corrupt" }
  ]);

  assert.equal(result.canonicalEvents.length, 2);
  assert.equal(result.duplicateSuppressedCount, 1);
  assert.equal(result.quarantined.length, 1);
  assert.deepEqual(result.canonicalEvents.map((event) => event.type), ["created", "dispatched"]);
});

test("authoritative timeline reconstruction exposes replay divergence", () => {
  const timeline = reconstructAuthoritativeTimeline({
    id: "inc-1",
    status: "dispatching",
    createdAt: "2026-05-21T10:00:00Z",
    events: [
      { id: "evt-1", type: "created", actor: "resident" },
      { id: "evt-1", type: "created", actor: "resident" },
      { id: "evt-2", actor: "system" }
    ]
  });

  assert.equal(timeline.auditFlags.divergenceDetected, true);
  assert.equal(timeline.auditFlags.duplicateSuppressedCount, 1);
  assert.equal(timeline.auditFlags.quarantinedCount, 1);
});

test("telecom reconciliation scores uncertainty and detects provider anomalies", () => {
  const result = reconcileTelecomReceipts(
    [
      { provider: "mtn-a", providerMessageId: "sms-1", state: "submitted", sentAt: "2026-05-21T10:00:00Z", receivedAt: "2026-05-21T10:01:00Z" },
      { provider: "mtn-a", providerMessageId: "sms-1", state: "delivered", sentAt: "2026-05-21T10:00:00Z", receivedAt: "2026-05-21T10:20:00Z" },
      { provider: "glo-b", providerMessageId: "sms-2", state: "failed", sentAt: "2026-05-21T10:00:00Z", receivedAt: "2026-05-21T10:02:00Z" }
    ],
    { delayedDeliveryToleranceMs: 5 * 60 * 1000 }
  );

  assert.equal(result.reconciledReceipts.length, 2);
  assert.equal(result.duplicateSuppressedCount, 1);
  assert.ok(result.providerAnomalies.some((item) => item.provider === "mtn-a"));
  assert.ok(result.averageConfidence < 0.8);
});

test("operational triage partitions overloaded queues and protects critical incidents", () => {
  const now = "2026-05-21T12:00:00Z";
  const incidents = Array.from({ length: 9 }, (_, index) => ({
    id: `inc-${index}`,
    severity: index === 4 ? "critical" : "moderate",
    status: "awaiting-response",
    createdAt: `2026-05-21T11:${String(40 + index).padStart(2, "0")}:00Z`,
    locationConfidence: 0.8
  }));

  const prioritized = prioritizeIncidentQueue(incidents, { now, operatorCount: 1, overloadThresholdPerOperator: 6 });
  const load = summarizeOperatorLoad(incidents, { operatorCount: 1 });

  assert.equal(prioritized[0].severity, "critical");
  assert.equal(prioritized[0].supervisorEscalationRequired, true);
  assert.equal(load.overloadState, "overloaded");
});

test("trust attack scoring escalates coordinated fake responder behavior", () => {
  const risk = scoreTrustAttackRisk({
    fakeVerificationAttempts: 2,
    sharedDocumentReuseCount: 1,
    coordinatedIncidentReports: 2,
    trustScoreJumpCount: 1,
    responderCollusionSignals: 1,
    spamBurstCount: 1
  });

  assert.equal(risk.riskBand, "critical");
  assert.equal(risk.requiredAction, "freeze-and-supervisor-review");
});

test("degraded mode evaluation preserves reduced capability under partial failure", () => {
  const state = evaluateDegradedModes({
    telecomHealthScore: 0.58,
    appConnectivityRate: 0.2,
    smsAvailabilityRate: 0.8,
    operatorLoadPerOperator: 8,
    activeIncidents: 12,
    availableResponders: 5
  });

  assert.ok(state.activeModes.includes("telecom-degraded"));
  assert.ok(state.activeModes.includes("sms-only"));
  assert.ok(state.activeModes.includes("operator-overload"));
  assert.ok(state.activeModes.includes("responder-scarcity"));
  assert.ok(state.allowedCapabilities.includes("sms-intake"));
  assert.notEqual(state.severity, "normal");
});

test("containment plan limits blast radius for replay, telecom, trust, and overload failures", () => {
  const plan = buildContainmentPlan({
    telecomHealthScore: 0.5,
    trustConfidenceScore: 0.52,
    operatorLoadPerOperator: 9,
    dbWriteFailureRate: 0.08,
    activeIncidents: 18,
    availableResponders: 6
  });

  const boundaries = plan.boundaries.map((item) => item.boundary);
  assert.ok(boundaries.includes("replay-quarantine-zone"));
  assert.ok(boundaries.includes("telecom-anomaly-isolation"));
  assert.ok(boundaries.includes("trust-risk-containment"));
  assert.ok(boundaries.includes("operator-circuit-breaker"));
  assert.ok(boundaries.includes("responder-group-segmentation"));
});

test("trust confidence degrades into supervised or blocked coordination instead of binary trust", () => {
  const partial = calculateTrustConfidence(
    { trustScore: 82, verificationStatus: "verified", reliabilityRate: 0.8 },
    { telecomUncertainty: 0.4, replayDivergence: 0.2, spamPressure: 0.3 }
  );
  const unsafe = calculateTrustConfidence(
    { trustScore: 40, verificationStatus: "pending", reliabilityRate: 0.3 },
    { spamPressure: 0.8, collusionRisk: 0.7 }
  );

  assert.equal(partial.coordinationMode, "supervised-dispatch");
  assert.equal(unsafe.coordinationMode, "blocked");
});

test("telecom health scoring degrades under anomalous receipts and provider heartbeat failure", () => {
  const health = scoreTelecomHealth(
    [
      { provider: "mtn-a", providerMessageId: "sms-1", state: "failed", sentAt: "2026-05-21T10:00:00Z", receivedAt: "2026-05-21T10:01:00Z" },
      { provider: "mtn-a", providerMessageId: "sms-1", state: "failed", sentAt: "2026-05-21T10:00:00Z", receivedAt: "2026-05-21T10:04:00Z" },
      { provider: "glo-b", providerMessageId: "sms-2", state: "pending", sentAt: "2026-05-21T10:00:00Z", receivedAt: "2026-05-21T10:30:00Z" }
    ],
    [
      { provider: "mtn-a", state: "down" },
      { provider: "glo-b", state: "degraded" }
    ]
  );

  assert.ok(["severe", "collapsed"].includes(health.healthBand));
  assert.ok(health.providerAnomalies.length >= 1);
});

test("emergent failure analysis detects compound degradation risks", () => {
  const analysis = analyzeEmergentFailures({
    telecomHealthScore: 0.52,
    appConnectivityRate: 0.2,
    smsAvailabilityRate: 0.8,
    dbWriteFailureRate: 0.08,
    replayDivergenceRate: 0.06,
    queueReplayRate: 160,
    operatorLoadPerOperator: 8
  });

  const riskNames = analysis.risks.map((risk) => risk.risk);
  assert.ok(riskNames.includes("operator-confusion-amplification"));
  assert.ok(riskNames.includes("replay-divergence-propagation"));
  assert.ok(riskNames.includes("synchronization-race-condition"));
  assert.equal(analysis.systemStability, "unstable");
});

test("recovery plan holds degraded mode until all exit checkpoints are complete", () => {
  const hold = buildRecoveryPlan(
    { telecomHealthScore: 0.6, operatorLoadPerOperator: 9 },
    {
      completedCheckpoints: ["telecom-health-stable", "operator-load-normal"],
      stabilizationWindows: { "telecom-degraded": 30, "operator-overload": 30 },
      acknowledgments: { "operator-overload": true }
    }
  );
  const ready = buildRecoveryPlan(
    { telecomHealthScore: 0.6, operatorLoadPerOperator: 9 },
    {
      completedCheckpoints: [
        "telecom-health-stable",
        "receipt-confidence-window-closed",
        "operator-load-normal",
        "supervisor-acknowledged-recovery"
      ],
      stabilizationWindows: { "telecom-degraded": 30, "operator-overload": 30 },
      acknowledgments: { "operator-overload": true }
    }
  );

  assert.equal(hold.recoveryState, "hold-degraded-mode");
  assert.equal(ready.recoveryState, "ready-for-controlled-exit");
  assert.deepEqual(ready.exitSequence, ["telecom-degraded", "operator-overload"]);
});

test("recovery plan requires stabilization windows and human acknowledgments", () => {
  const plan = buildRecoveryPlan(
    { trustConfidenceScore: 0.5, dbWriteFailureRate: 0.08 },
    {
      completedCheckpoints: [
        "trust-anomaly-reviewed",
        "confidence-stabilized",
        "replay-divergence-resolved",
        "canonical-timeline-checkpointed"
      ],
      stabilizationWindows: { "low-trust": 30, "partial-db-recovery": 45 },
      acknowledgments: { "partial-db-recovery": true }
    }
  );

  const lowTrustPlan = plan.modePlans.find((item) => item.mode === "low-trust");
  assert.equal(plan.recoveryState, "hold-degraded-mode");
  assert.equal(lowTrustPlan.stabilizationWindowSatisfied, false);
  assert.equal(lowTrustPlan.humanAcknowledgmentSatisfied, false);
});

test("convergence scenario produces telemetry for operators without hiding instability", () => {
  const result = evaluateConvergenceScenario({
    id: "compound-test",
    name: "Compound degradation test",
    signal: {
      regionalBackhaulDown: true,
      trustConfidenceScore: 0.4,
      activeIncidents: 28,
      availableResponders: 8,
      disasterSignals: 2
    },
    recoveryEvidence: { completedCheckpoints: [] }
  });
  const telemetry = buildTelemetrySnapshot(result);

  assert.equal(result.convergence.stable, false);
  assert.equal(result.recoveryAction.action, "rollback-to-degraded-mode");
  assert.ok(telemetry.activeModes.includes("regional-isolation"));
  assert.ok(telemetry.activeModes.includes("low-trust"));
  assert.ok(telemetry.activeModes.includes("disaster-surge"));
  assert.equal(telemetry.recoveryState, "hold-degraded-mode");
});

test("recovery action allows controlled exit only with ready confidence and no critical risks", () => {
  const result = evaluateConvergenceScenario({
    id: "clean-recovery",
    name: "Clean recovery",
    signal: {
      telecomHealthScore: 0.7
    },
    recoveryEvidence: {
      completedCheckpoints: ["telecom-health-stable", "receipt-confidence-window-closed"],
      stabilizationWindows: { "telecom-degraded": 35 },
      acknowledgments: {
        "operator-overload": true,
        "partial-db-recovery": true,
        "low-trust": true
      }
    }
  });
  const action = decideRecoveryAction(result);

  assert.equal(result.convergenceConfidence.band, "ready");
  assert.equal(action.action, "controlled-exit");
});

test("stability memory classifies repeated instability patterns", () => {
  const memory = summarizeStabilityMemory({
    repeatedInstabilityCount: 4,
    recoveryRollbackCount: 3,
    oscillationCount: 2,
    chronicReplayDivergenceCount: 2,
    trustVolatilityCount: 1
  });

  assert.equal(memory.memoryBand, "volatile");
  assert.ok(memory.instabilityMemoryScore > 0.4);
});

test("instability propagation detects cross-layer amplification", () => {
  const propagation = modelInstabilityPropagation({
    telecomHealthScore: 0.42,
    operatorLoadPerOperator: 9,
    replayDivergenceRate: 0.08,
    unreconciledIncidentRate: 0.12,
    activeIncidents: 44,
    availableResponders: 12,
    queueReplayRate: 180
  });

  assert.ok(["high", "critical"].includes(propagation.propagationBand));
  assert.ok(propagation.propagation.telecomToOperator > 0.5);
  assert.ok(propagation.propagation.replayToTrust > 0.5);
});

test("confidence evolution penalizes oscillation, recurrence, and human uncertainty", () => {
  const evolved = evolveConfidence(0.91, {
    signal: { telecomHealthScore: 0.5, operatorLoadPerOperator: 8, queueReplayRate: 140 },
    history: { recoveryRollbackCount: 2, oscillationCount: 3, repeatedInstabilityCount: 3 },
    human: { fatigueRisk: 0.7, situationalConfusion: 0.5, overconfidenceAfterRecovery: 0.6 }
  });

  assert.ok(evolved.score < 0.75);
  assert.notEqual(evolved.band, "ready");
  assert.ok(evolved.penalties.oscillationPenalty > 0);
});

test("adaptive recovery becomes more conservative under uncertainty", () => {
  const convergence = evaluateConvergenceScenario({
    id: "adaptive-test",
    name: "Adaptive test",
    signal: { telecomHealthScore: 0.7 },
    recoveryEvidence: {
      completedCheckpoints: ["telecom-health-stable", "receipt-confidence-window-closed"],
      stabilizationWindows: { "telecom-degraded": 35 },
      acknowledgments: { "operator-overload": true, "partial-db-recovery": true, "low-trust": true }
    }
  });
  const recommendation = recommendAdaptiveRecovery(convergence, {
    signal: { telecomHealthScore: 0.56, operatorLoadPerOperator: 7, queueReplayRate: 120 },
    history: { recoveryRollbackCount: 2, oscillationCount: 4, repeatedInstabilityCount: 5 },
    human: { fatigueRisk: 0.6, situationalConfusion: 0.4 }
  });

  assert.notEqual(recommendation.action, "adaptive-controlled-exit");
  assert.ok(recommendation.policy.dynamicThresholds.controlledExit > 0.9);
  assert.ok(recommendation.policy.stabilizationMultiplier > 1);
});

test("adaptive policy permits safe partial recovery when full normalization is too risky", () => {
  const convergence = evaluateConvergenceScenario({
    id: "partial-recovery-test",
    name: "Partial recovery test",
    signal: { telecomHealthScore: 0.7 },
    recoveryEvidence: {
      completedCheckpoints: ["telecom-health-stable", "receipt-confidence-window-closed"],
      stabilizationWindows: { "telecom-degraded": 35 },
      acknowledgments: { "operator-overload": true, "partial-db-recovery": true, "low-trust": true }
    }
  });
  const recommendation = recommendAdaptiveRecovery(convergence, {
    signal: { telecomHealthScore: 0.76, operatorLoadPerOperator: 5 },
    history: { recoveryRollbackCount: 1, repeatedInstabilityCount: 1 },
    human: { fatigueRisk: 0.2 }
  });
  const policy = calculateAdaptiveRecoveryPolicy(convergence, {
    signal: { telecomHealthScore: 0.76, operatorLoadPerOperator: 5 },
    history: { recoveryRollbackCount: 1, repeatedInstabilityCount: 1 },
    human: { fatigueRisk: 0.2 }
  });

  assert.equal(recommendation.action, "safe-partial-recovery");
  assert.ok(recommendation.allowedRestoration.includes("supervised-dispatch"));
  assert.ok(policy.conservatism > 0);
});

test("long-horizon resilience flags chronic operational risk", () => {
  const result = analyzeLongHorizonResilience({
    weeksObserved: 4,
    telecomDegradedDays: 12,
    operatorOverloadHours: 180,
    disasterModeActivations: 5,
    responderDropoutRate: 0.18,
    avgResponderHoursPerWeek: 52,
    replayDivergenceEvents: 48,
    institutionalAcknowledgmentRate: 0.62
  });

  assert.ok(["high", "critical"].includes(result.chronicRiskBand));
  assert.ok(result.components.telecomVolatility > 0.4);
});

test("operational trust durability detects ecosystem trust erosion", () => {
  const result = evaluateOperationalTrustDurability({
    responderReliabilityTrend: 0.58,
    operatorConfidenceTrend: 0.62,
    institutionalParticipationConsistency: 0.54,
    recurringFalseReportRegionRate: 0.34,
    chronicInstabilityZoneRate: 0.42,
    trustVolatilityRate: 0.38
  });

  assert.equal(result.durabilityBand, "fragile");
  assert.equal(result.requiredAction, "restrict-expansion-and-rebuild-trust");
});

test("institutional reliability selects fallback mode for weak partners", () => {
  const result = scoreInstitutionalReliability({
    acknowledgmentRate: 0.5,
    handoffCompletionRate: 0.52,
    communicationContinuity: 0.48,
    authorityClarity: 0.6,
    overloadRate: 0.4,
    professionalismIncidentRate: 0.2
  });

  assert.equal(result.reliabilityBand, "weak");
  assert.equal(result.integrationMode, "fallback-only");
});

test("regional deployment readiness blocks uneven regions from live expansion", () => {
  const result = modelRegionalDeploymentReadiness([
    {
      id: "yaba-core",
      telecomReliability: 0.78,
      institutionalCapacity: 0.72,
      responderDensity: 0.8,
      operatorCoverage: 0.76,
      governanceReadiness: 0.82,
      degradationDiversity: 0.2
    },
    {
      id: "peri-urban-edge",
      telecomReliability: 0.42,
      institutionalCapacity: 0.38,
      responderDensity: 0.34,
      operatorCoverage: 0.46,
      governanceReadiness: 0.4,
      degradationDiversity: 0.7
    }
  ]);

  assert.ok(result.blockedRegions.includes("peri-urban-edge"));
  assert.equal(result.regions[1].recommendedMode, "governance-and-capacity-building");
});

test("governance posture freezes expansion when trust and institutions drift", () => {
  const result = recommendGovernancePosture({
    history: {
      weeksObserved: 6,
      telecomDegradedDays: 30,
      operatorOverloadHours: 620,
      disasterModeActivations: 14,
      responderDropoutRate: 0.45,
      avgResponderHoursPerWeek: 72,
      replayDivergenceEvents: 160,
      institutionalAcknowledgmentRate: 0.24
    },
    trust: {
      responderReliabilityTrend: 0.28,
      operatorConfidenceTrend: 0.32,
      institutionalParticipationConsistency: 0.26,
      recurringFalseReportRegionRate: 0.72,
      chronicInstabilityZoneRate: 0.78,
      trustVolatilityRate: 0.68
    },
    institutions: [
      {
        acknowledgmentRate: 0.32,
        handoffCompletionRate: 0.34,
        communicationContinuity: 0.3,
        authorityClarity: 0.36,
        overloadRate: 0.72,
        professionalismIncidentRate: 0.4
      }
    ],
    governance: {
      auditBacklogRate: 0.9
    }
  });

  assert.equal(result.governancePosture, "freeze-expansion");
});

test("deployment governance blocks activation when readiness gates fail", () => {
  const result = evaluateDeploymentGovernance({
    readinessScore: 0.9,
    governanceReadiness: 0.9,
    trustDurabilityScore: 0.88,
    institutionalReliabilityScore: 0.82,
    auditCompleteness: 0.92,
    convergencePassed: false,
    fieldReadinessPassed: false,
    reviewBoardApproved: true,
    unresolvedCriticalRisks: 0
  });

  assert.equal(result.decision, "shadow-or-limited-hours-only");
  assert.ok(result.blockers.includes("field-readiness-not-passed"));
  assert.ok(result.blockers.includes("convergence-not-passed"));
});

test("governance authority escalates powers under disaster and trust risk", () => {
  const disaster = determineGovernanceAuthority({ lifeSafetyRisk: 0.95, activeDisasterMode: true });
  const trust = determineGovernanceAuthority({ trustRiskScore: 0.8, responderMisconductAllegation: true });

  assert.equal(disaster.authority, "emergency-shutdown-or-disaster-supervisor");
  assert.ok(disaster.powers.includes("activate-disaster-mode"));
  assert.equal(trust.authority, "trust-administrator-and-review-board");
  assert.ok(trust.powers.includes("freeze-responder"));
});

test("civic trust safeguards block expansion when transparency and appeal are weak", () => {
  const result = evaluateCivicTrustSafeguards({
    transparencyCoverage: 0.5,
    operatorAccountability: 0.62,
    appealMechanismCoverage: 0.28,
    misuseReportingAvailability: 0.42,
    auditVisibilityScore: 0.45,
    privacyMinimizationScore: 0.72,
    antiSurveillanceBoundaryScore: 0.8
  });

  assert.equal(result.safeguardBand, "weak");
  assert.equal(result.requiredAction, "block-expansion-until-safeguards-improve");
});

test("operational liability model freezes evidence under severe accountability risk", () => {
  const result = modelOperationalLiability({
    responderMisconductRisk: 0.9,
    operatorNegligenceRisk: 0.82,
    delayedCoordinationRisk: 0.78,
    institutionalNonResponseRisk: 0.7,
    telecomFailureRisk: 0.6,
    escalationDisputeRisk: 0.7,
    evidenceIntegrityRisk: 0.86
  });

  assert.equal(result.liabilityBand, "severe");
  assert.ok(result.requiredControls.includes("evidence-freeze"));
  assert.ok(result.requiredControls.includes("deployment-freeze"));
});

test("safe pilot governance limits immature programs to dry runs", () => {
  const result = evaluateSafePilotGovernance({
    supervisionCoverage: 0.62,
    incidentReviewBoardReadiness: 0.58,
    responderCertificationCoverage: 0.48,
    auditScheduleCompliance: 0.55,
    escalationCommitteeReadiness: 0.5,
    fieldCoordinatorCoverage: 0.6,
    shutdownProcedureReadiness: 0.52
  });

  assert.equal(result.pilotGovernanceBand, "immature");
  assert.equal(result.operatingMode, "dry-runs-only");
});

test("pre-deployment decision approves only governed controlled pilots", () => {
  const approved = recommendPreDeploymentDecision({
    deployment: {
      readinessScore: 0.95,
      governanceReadiness: 0.94,
      trustDurabilityScore: 0.9,
      institutionalReliabilityScore: 0.88,
      auditCompleteness: 0.96,
      convergencePassed: true,
      fieldReadinessPassed: true,
      reviewBoardApproved: true,
      unresolvedCriticalRisks: 0
    },
    safeguards: {
      transparencyCoverage: 0.92,
      operatorAccountability: 0.94,
      appealMechanismCoverage: 0.9,
      misuseReportingAvailability: 0.88,
      auditVisibilityScore: 0.9,
      privacyMinimizationScore: 0.94,
      antiSurveillanceBoundaryScore: 0.95
    },
    liability: {
      responderMisconductRisk: 0.12,
      operatorNegligenceRisk: 0.12,
      delayedCoordinationRisk: 0.18,
      institutionalNonResponseRisk: 0.2,
      telecomFailureRisk: 0.22,
      escalationDisputeRisk: 0.14,
      evidenceIntegrityRisk: 0.1
    },
    pilot: {
      supervisionCoverage: 0.94,
      incidentReviewBoardReadiness: 0.92,
      responderCertificationCoverage: 0.9,
      auditScheduleCompliance: 0.9,
      escalationCommitteeReadiness: 0.88,
      fieldCoordinatorCoverage: 0.9,
      shutdownProcedureReadiness: 0.92
    }
  });

  assert.equal(approved.decision, "approve-controlled-pilot");
});

test("pilot scope rejects overbroad consumer-style rollout", () => {
  const result = evaluatePilotScope({
    residentCount: 800,
    responderCount: 60,
    operatorCount: 1,
    dailyOperationalHours: 14,
    permittedIncidentCategories: ["medical", "kidnap"],
    singleNeighborhood: false
  });

  assert.equal(result.scopeBand, "unsafe");
  assert.equal(result.permittedMode, "do-not-run");
  assert.ok(result.blockers.includes("resident-count-exceeds-controlled-pilot-limit"));
});

test("human field preparation limits weak teams to dry runs", () => {
  const result = evaluateHumanFieldPreparation({
    responderOnboardingCompletion: 0.62,
    operatorTrainingCompletion: 0.58,
    supervisorReviewReadiness: 0.54,
    escalationCommsDrillCompletion: 0.6,
    degradedModeTrainingCompletion: 0.42,
    telecomFailureDrillCompletion: 0.5,
    incidentReviewWorkflowReadiness: 0.56
  });

  assert.equal(result.preparationBand, "immature");
  assert.equal(result.requiredAction, "dry-runs-only");
});

test("live observability blocks blind pilots", () => {
  const result = evaluateLiveObservability({
    degradedStateVisibility: 0.42,
    operatorCognitiveLoadVisibility: 0.38,
    telecomInstabilityVisibility: 0.5,
    replayDivergenceVisibility: 0.36,
    trustVolatilityVisibility: 0.44,
    institutionalNonResponseVisibility: 0.4,
    escalationBottleneckVisibility: 0.48,
    recoveryConvergenceVisibility: 0.34
  });

  assert.equal(result.observabilityBand, "blind");
  assert.equal(result.requiredAction, "do-not-run");
});

test("field safety constraints pause live pilot under compound operational risk", () => {
  const result = evaluateFieldSafetyConstraints({
    trustConfidenceScore: 0.62,
    operatorLoadPerOperator: 7,
    telecomHealthScore: 0.58,
    replayDivergenceRate: 0.03,
    institutionalAcknowledgmentRate: 0.5,
    activeDegradedModes: 2,
    lifeSafetyHighRiskRate: 0.3
  });

  assert.equal(result.safetyBand, "pause-required");
  assert.equal(result.requiredAction, "pause-live-pilot");
});

test("telecom field validation rejects unsafe live telecom assumptions", () => {
  const result = evaluateTelecomFieldValidation({
    p95SmsLatencySeconds: 420,
    deliveryReceiptConfidence: 0.42,
    providerConsistencyScore: 0.46,
    lowBatteryDeliveryReliability: 0.38,
    androidBackgroundReliability: 0.32,
    prolongedOfflineRecoveryRate: 0.44
  });

  assert.equal(result.telecomValidationBand, "unsafe");
  assert.equal(result.requiredAction, "do-not-run-live-telecom-flow");
});

test("limited pilot decision allows only constrained supervised pilot", () => {
  const result = recommendLimitedPilotDecision({
    governanceDecision: "approve-controlled-pilot",
    scope: {
      residentCount: 220,
      responderCount: 18,
      operatorCount: 3,
      dailyOperationalHours: 6,
      permittedIncidentCategories: ["medical", "help", "suspicious-activity"],
      singleNeighborhood: true
    },
    human: {
      responderOnboardingCompletion: 0.9,
      operatorTrainingCompletion: 0.92,
      supervisorReviewReadiness: 0.9,
      escalationCommsDrillCompletion: 0.88,
      degradedModeTrainingCompletion: 0.9,
      telecomFailureDrillCompletion: 0.88,
      incidentReviewWorkflowReadiness: 0.9
    },
    observability: {
      degradedStateVisibility: 0.9,
      operatorCognitiveLoadVisibility: 0.88,
      telecomInstabilityVisibility: 0.9,
      replayDivergenceVisibility: 0.88,
      trustVolatilityVisibility: 0.9,
      institutionalNonResponseVisibility: 0.88,
      escalationBottleneckVisibility: 0.88,
      recoveryConvergenceVisibility: 0.9
    },
    safety: {
      trustConfidenceScore: 0.86,
      operatorLoadPerOperator: 3,
      telecomHealthScore: 0.74,
      replayDivergenceRate: 0,
      institutionalAcknowledgmentRate: 0.72,
      activeDegradedModes: 0,
      lifeSafetyHighRiskRate: 0.05
    },
    telecom: {
      p95SmsLatencySeconds: 170,
      deliveryReceiptConfidence: 0.78,
      providerConsistencyScore: 0.74,
      lowBatteryDeliveryReliability: 0.76,
      androidBackgroundReliability: 0.72,
      prolongedOfflineRecoveryRate: 0.78
    }
  });

  assert.equal(result.decision, "run-limited-supervised-pilot");
  assert.equal(result.scope.scopeBand, "controlled");
});

test("observed field truth overrides optimistic simulation assumptions", () => {
  const result = evaluateObservedFieldTruth({
    p95SmsLatencySeconds: 360,
    androidBackgroundFailureRate: 0.34,
    lowBatterySurvivalRate: 0.58,
    p95GpsDriftMeters: 180,
    p95ResponderAckSeconds: 420,
    operatorSaturationRate: 0.38,
    institutionalResponseConsistency: 0.52
  });

  assert.equal(result.fieldTruthBand, "fragile");
  assert.equal(result.overridesSimulation, true);
});

test("blind spot discovery surfaces hidden operational fragility", () => {
  const result = discoverOperationalBlindSpots({
    syncDivergenceDetected: 4,
    syncDivergenceVisible: 1,
    replayConflictRate: 0.03,
    replayConflictVisibility: 0.5,
    confidenceNormalizationEvents: 2,
    postRecoveryVerificationRate: 0.6,
    degradedModeMinutes: 90,
    degradedModeOperatorAwareness: 0.5,
    escalationTimingVarianceSeconds: 240,
    operatorMisunderstandingReports: 1,
    telecomPartialFailureDetected: 3,
    telecomPartialFailureVisible: 1
  });

  assert.equal(result.blindSpotBand, "critical");
  assert.equal(result.requiredAction, "pause-and-investigate");
});

test("human factor validation pauses unsafe human-dependent flows", () => {
  const result = evaluateHumanFactorValidation({
    responderHesitationRate: 0.72,
    operatorOverloadReactionFailureRate: 0.76,
    panicMisuseRate: 0.58,
    escalationDisciplineScore: 0.24,
    fatigueMistakeRate: 0.68,
    supervisionEffectivenessScore: 0.28,
    uncertaintyCommunicationQuality: 0.22
  });

  assert.equal(result.humanValidationBand, "unsafe");
  assert.equal(result.requiredAction, "pause-human-dependent-flows");
});

test("governance durability freezes pilot when oversight erodes", () => {
  const result = evaluateGovernanceDurability({
    reviewDisciplineScore: 0.35,
    governanceFatigueRate: 0.64,
    policyDriftRate: 0.58,
    oversightErosionRate: 0.62,
    supervisorOverloadRate: 0.66,
    institutionalCoordinationBreakdownRate: 0.7
  });

  assert.equal(result.governanceDurabilityBand, "failing");
  assert.equal(result.requiredAction, "freeze-pilot-governance-failure");
});

test("certification state remains restricted when hard readiness gates fail", () => {
  const result = determineCertificationState({
    readinessGates: { field: false, stress: false, convergence: false },
    fieldTruth: {
      p95SmsLatencySeconds: 180,
      androidBackgroundFailureRate: 0.08,
      lowBatterySurvivalRate: 0.82,
      p95GpsDriftMeters: 90,
      p95ResponderAckSeconds: 220,
      operatorSaturationRate: 0.16,
      institutionalResponseConsistency: 0.78
    },
    blindSpots: {
      syncDivergenceDetected: 1,
      syncDivergenceVisible: 1,
      replayConflictRate: 0,
      confidenceNormalizationEvents: 0,
      degradedModeMinutes: 0,
      escalationTimingVarianceSeconds: 60,
      telecomPartialFailureDetected: 1,
      telecomPartialFailureVisible: 1
    },
    human: {
      responderHesitationRate: 0.12,
      operatorOverloadReactionFailureRate: 0.12,
      panicMisuseRate: 0.08,
      escalationDisciplineScore: 0.84,
      fatigueMistakeRate: 0.12,
      supervisionEffectivenessScore: 0.86,
      uncertaintyCommunicationQuality: 0.82
    },
    governance: {
      reviewDisciplineScore: 0.86,
      governanceFatigueRate: 0.12,
      policyDriftRate: 0.1,
      oversightErosionRate: 0.1,
      supervisorOverloadRate: 0.12,
      institutionalCoordinationBreakdownRate: 0.16
    }
  });

  assert.equal(result.certificationState, "restricted-supervised-validation");
  assert.ok(result.restrictions.includes("field-readiness-gate-not-passed"));
  assert.ok(result.restrictions.includes("convergence-gate-not-passed"));
});

test("experiment approval rejects unsafe uncontrolled field experiments", () => {
  const result = evaluateExperimentApproval({
    supervisorAssigned: false,
    rollbackAuthorityAssigned: false,
    auditTrailEnabled: true,
    participantConsentRecorded: false,
    maxParticipants: 120,
    durationHours: 8,
    incidentCategories: ["medical", "violent-crime"],
    liveDispatchEnabled: true,
    manualApprovalRequired: false
  });

  assert.equal(result.approvalState, "rejected");
  assert.equal(result.allowedMode, "do-not-run");
  assert.ok(result.blockers.includes("supervisor-not-assigned"));
});

test("observed reality divergence pauses assumption-driven confidence", () => {
  const result = compareObservedToAssumptions(
    {
      p95SmsLatencySeconds: 120,
      p95ResponderAckSeconds: 180,
      p95OperatorDecisionSeconds: 90,
      p95GpsDriftMeters: 60,
      lowBatteryFailureRate: 0.08,
      syncDivergenceRate: 0.005,
      institutionalNonResponseRate: 0.15
    },
    {
      p95SmsLatencySeconds: 420,
      p95ResponderAckSeconds: 520,
      p95OperatorDecisionSeconds: 360,
      p95GpsDriftMeters: 210,
      lowBatteryFailureRate: 0.42,
      syncDivergenceRate: 0.06,
      institutionalNonResponseRate: 0.5
    }
  );

  assert.equal(result.divergenceBand, "severe");
  assert.equal(result.requiredAction, "pause-and-recalibrate-assumptions");
});

test("human chaos model escalates supervision under stress behavior", () => {
  const result = evaluateHumanChaos({
    confusionUnderStressRate: 0.5,
    inconsistentEscalationRate: 0.58,
    panicMisuseRate: 0.32,
    fatigueDegradationRate: 0.55,
    supervisionDependenceRate: 0.62,
    emotionalOverloadRate: 0.48,
    delayedSituationalComprehensionRate: 0.54
  });

  assert.equal(result.chaosBand, "high");
  assert.equal(result.requiredAction, "increase-supervision-and-reduce-scope");
});

test("operational fatigue stops experiment under severe long-duration decay", () => {
  const result = evaluateOperationalFatigue({
    operatorPerformanceDecayRate: 0.8,
    responderReliabilityDecayRate: 0.72,
    supervisionOverloadAccumulation: 0.76,
    degradedModeNormalizationRisk: 0.82,
    alertFatigueRate: 0.7,
    governanceReviewFatigueRate: 0.68
  });

  assert.equal(result.fatigueBand, "severe");
  assert.equal(result.requiredAction, "stop-experiment-and-rest");
});

test("false confidence detection blocks cosmetic recovery narratives", () => {
  const result = detectFalseConfidence({
    recoveryConfidence: 0.92,
    postRecoveryVerificationRate: 0.5,
    replayCertaintyScore: 0.9,
    hiddenReplayConflictRate: 0.03,
    degradedModeActiveMinutes: 80,
    dashboardShowsNormal: true,
    operatorConfusionReports: 2,
    operatorClarityScore: 0.9,
    syncDriftDetected: 4,
    syncDriftDisplayed: 1,
    governanceReviewSkippedCount: 1,
    governanceHealthScore: 0.88
  });

  assert.equal(result.falseConfidenceBand, "critical");
  assert.equal(result.requiredAction, "pause-and-reset-confidence");
});

test("reality experiment decision permits only constrained observable experiments", () => {
  const result = recommendRealityExperimentDecision({
    experiment: {
      supervisorAssigned: true,
      rollbackAuthorityAssigned: true,
      auditTrailEnabled: true,
      participantConsentRecorded: true,
      maxParticipants: 25,
      durationHours: 2,
      incidentCategories: ["medical", "help"],
      liveDispatchEnabled: false,
      manualApprovalRequired: true
    },
    assumptions: {
      p95SmsLatencySeconds: 150,
      p95ResponderAckSeconds: 220,
      p95OperatorDecisionSeconds: 120,
      p95GpsDriftMeters: 80,
      lowBatteryFailureRate: 0.12,
      syncDivergenceRate: 0.01,
      institutionalNonResponseRate: 0.2
    },
    observed: {
      p95SmsLatencySeconds: 170,
      p95ResponderAckSeconds: 240,
      p95OperatorDecisionSeconds: 140,
      p95GpsDriftMeters: 95,
      lowBatteryFailureRate: 0.14,
      syncDivergenceRate: 0.012,
      institutionalNonResponseRate: 0.22
    },
    human: {
      confusionUnderStressRate: 0.12,
      inconsistentEscalationRate: 0.1,
      panicMisuseRate: 0.08,
      fatigueDegradationRate: 0.1,
      supervisionDependenceRate: 0.2,
      emotionalOverloadRate: 0.1,
      delayedSituationalComprehensionRate: 0.12
    },
    fatigue: {
      operatorPerformanceDecayRate: 0.1,
      responderReliabilityDecayRate: 0.12,
      supervisionOverloadAccumulation: 0.1,
      degradedModeNormalizationRisk: 0.08,
      alertFatigueRate: 0.1,
      governanceReviewFatigueRate: 0.1
    },
    falseConfidence: {
      recoveryConfidence: 0.6,
      postRecoveryVerificationRate: 0.95,
      replayCertaintyScore: 0.6,
      hiddenReplayConflictRate: 0,
      degradedModeActiveMinutes: 0,
      dashboardShowsNormal: false,
      operatorConfusionReports: 0,
      syncDriftDetected: 1,
      syncDriftDisplayed: 1,
      governanceReviewSkippedCount: 0
    }
  });

  assert.equal(result.decision, "run-controlled-reality-experiment");
});

test("operational memory accumulates recurring reality signals", () => {
  const result = accumulateOperationalReality([
    { date: "2026-05-01", telecomState: "degraded", responderAbandonmentRate: 0.1, operatorFatigueScore: 0.3, escalationInconsistencyRate: 0.12, degradedModeHours: 4, syncDriftEvents: 2, trustVolatilityRate: 0.2 },
    { date: "2026-05-02", telecomState: "collapsed", responderAbandonmentRate: 0.18, operatorFatigueScore: 0.5, escalationInconsistencyRate: 0.22, degradedModeHours: 8, syncDriftEvents: 4, trustVolatilityRate: 0.35, governanceReviewMissed: true },
    { date: "2026-05-03", telecomState: "normal", responderAbandonmentRate: 0.12, operatorFatigueScore: 0.4, escalationInconsistencyRate: 0.18, degradedModeHours: 2, syncDriftEvents: 1, trustVolatilityRate: 0.25 }
  ]);

  assert.equal(result.observedDays, 3);
  assert.equal(result.recurrence.telecomInstabilityRate, 0.667);
  assert.equal(result.recurrence.degradedPersistenceHours, 14);
});

test("reality model divergence suspends assumption-driven decisions", () => {
  const result = analyzeRealityModelDivergence(
    {
      p95SmsLatencySeconds: 120,
      responderReliability: 0.92,
      operatorOverloadRate: 0.12,
      telecomReliability: 0.9,
      governanceReviewCompletionRate: 0.95,
      trustStability: 0.9,
      recoverySuccessRate: 0.9
    },
    {
      p95SmsLatencySeconds: 520,
      responderReliability: 0.42,
      operatorOverloadRate: 0.68,
      telecomReliability: 0.36,
      governanceReviewCompletionRate: 0.58,
      trustStability: 0.48,
      recoverySuccessRate: 0.52
    }
  );

  assert.equal(result.driftBand, "model-invalid");
  assert.equal(result.requiredAction, "suspend-assumption-driven-decisions");
});

test("instability fingerprints identify chronic regions and unreliable institutions", () => {
  const result = buildInstabilityFingerprints([
    { regionId: "yaba-west", telecomProvider: "mtn", institutionId: "clinic-a", telecomState: "degraded", delayedReceiptAnomaly: true, degradedModeHours: 6, syncDriftEvents: 5, trustVolatilityRate: 0.4, institutionNonResponse: true, institutionHandoffFailures: 2 },
    { regionId: "yaba-west", telecomProvider: "mtn", institutionId: "clinic-a", telecomState: "collapsed", delayedReceiptAnomaly: true, degradedModeHours: 8, syncDriftEvents: 6, trustVolatilityRate: 0.5, institutionNonResponse: true, institutionHandoffFailures: 3 },
    { regionId: "yaba-east", telecomProvider: "glo", institutionId: "clinic-b", telecomState: "normal", degradedModeHours: 1, syncDriftEvents: 0, trustVolatilityRate: 0.1 }
  ]);

  assert.ok(result.chronicRegions.some((region) => region.id === "yaba-west"));
  assert.equal(result.telecomProviders.find((provider) => provider.id === "mtn").recurrenceScore, 1);
  assert.ok(result.institutions.find((institution) => institution.id === "clinic-a").reliabilityRisk > 0.7);
});

test("false normalization detection blocks comfort with degraded operations", () => {
  const result = detectFalseNormalization({
    recurrence: {
      degradedPersistenceHours: 18,
      governanceMissRate: 0.25,
      trustVolatilityTrend: 0.4,
      telecomInstabilityRate: 0.5,
      operatorFatigueTrend: 0.45
    },
    reportedOperationalStatus: "normal",
    governanceConfidence: 0.82,
    trustNarrative: "stable",
    telecomConfidence: 0.8,
    staffingNarrative: "healthy"
  });

  assert.equal(result.normalizationBand, "critical");
  assert.equal(result.requiredAction, "freeze-normalization-and-review-governance");
});

test("operational memory posture freezes assumption-driven operations under drift", () => {
  const result = recommendOperationalMemoryPosture({
    records: [
      { date: "2026-05-01", regionId: "yaba-west", telecomProvider: "mtn", institutionId: "clinic-a", telecomState: "degraded", delayedReceiptAnomaly: true, degradedModeHours: 6, syncDriftEvents: 5, trustVolatilityRate: 0.4, governanceReviewMissed: true },
      { date: "2026-05-02", regionId: "yaba-west", telecomProvider: "mtn", institutionId: "clinic-a", telecomState: "collapsed", delayedReceiptAnomaly: true, degradedModeHours: 8, syncDriftEvents: 6, trustVolatilityRate: 0.5, governanceReviewMissed: true }
    ],
    expected: { p95SmsLatencySeconds: 120, responderReliability: 0.92, operatorOverloadRate: 0.12, telecomReliability: 0.9, governanceReviewCompletionRate: 0.95, trustStability: 0.9, recoverySuccessRate: 0.9 },
    observed: { p95SmsLatencySeconds: 540, responderReliability: 0.44, operatorOverloadRate: 0.66, telecomReliability: 0.34, governanceReviewCompletionRate: 0.55, trustStability: 0.46, recoverySuccessRate: 0.5 },
    narrative: { reportedOperationalStatus: "normal", governanceConfidence: 0.82, trustNarrative: "stable", telecomConfidence: 0.82, staffingNarrative: "healthy" }
  });

  assert.equal(result.posture, "freeze-assumption-driven-operations");
  assert.equal(result.divergence.driftBand, "model-invalid");
  assert.equal(result.normalization.normalizationBand, "critical");
});

test("knowledge limit scoring exposes incomplete operational understanding", () => {
  const result = scoreKnowledgeLimits({
    sampleCoverageRate: 0.25,
    independentSourceCoverage: 0.3,
    daysSinceLastObservation: 18,
    contradictionRate: 0.42,
    modelErrorRate: 0.38,
    unexplainedIncidentRate: 0.3
  });

  assert.equal(result.knowledgeBand, "incomplete");
  assert.ok(result.uncertaintyScore >= 0.4);
});

test("memory confidence decays with age and contradiction", () => {
  const result = ageMemoryConfidence(
    [
      { id: "old-pattern", observedAt: "2026-01-01", confidence: 0.9, recurrenceCount: 3, contradictionRate: 0.4 },
      { id: "recent-pattern", observedAt: "2026-05-20", confidence: 0.7, recurrenceCount: 2, contradictionRate: 0.05 }
    ],
    "2026-05-21"
  );

  assert.equal(result.staleRecordCount, 1);
  assert.ok(result.records.find((record) => record.id === "old-pattern").effectiveConfidence < 0.2);
  assert.ok(result.records.find((record) => record.id === "recent-pattern").effectiveConfidence > 0.6);
});

test("historical overconfidence detection rejects memory as certification", () => {
  const result = detectHistoricalOverconfidence({
    historicalConfidence: 0.9,
    recentContradictionRate: 0.32,
    repeatedPatternCount: 10,
    independentValidationRate: 0.4,
    chronicRiskKnownDays: 45,
    operationalRestrictionLevel: "normal",
    memoryUsedAsCertificationEvidence: true,
    governanceReviewCadenceDays: 21,
    familiarityWithRegion: 0.86,
    stabilityTrendScore: 0.9,
    hiddenAnomalyRate: 0.22
  });

  assert.equal(result.overconfidenceBand, "critical");
  assert.equal(result.requiredAction, "freeze-certainty-claims-and-reopen-review");
});

test("multi-perspective truth comparison holds conflicted evidence", () => {
  const result = compareOperationalPerspectives({
    operator: 0.86,
    responder: 0.42,
    telemetry: 0.3,
    replay: 0.74,
    governance: 0.5
  });

  assert.equal(result.truthState, "conflicted");
  assert.ok(result.missingSources.includes("telecom"));
  assert.equal(result.requiredAction, "do-not-use-as-operational-certainty");
});

test("epistemic decision freezes certainty claims under overconfidence", () => {
  const result = recommendEpistemicDecision({
    asOfDate: "2026-05-21",
    knowledge: {
      sampleCoverageRate: 0.25,
      independentSourceCoverage: 0.3,
      daysSinceLastObservation: 18,
      contradictionRate: 0.42,
      modelErrorRate: 0.38,
      unexplainedIncidentRate: 0.3
    },
    memoryRecords: [
      { id: "old-pattern", observedAt: "2026-01-01", confidence: 0.9, recurrenceCount: 3, contradictionRate: 0.4 }
    ],
    overconfidence: {
      historicalConfidence: 0.9,
      recentContradictionRate: 0.32,
      repeatedPatternCount: 10,
      independentValidationRate: 0.4,
      chronicRiskKnownDays: 45,
      operationalRestrictionLevel: "normal",
      memoryUsedAsCertificationEvidence: true,
      governanceReviewCadenceDays: 21,
      familiarityWithRegion: 0.86,
      stabilityTrendScore: 0.9,
      hiddenAnomalyRate: 0.22
    },
    perspectives: {
      operator: 0.86,
      responder: 0.42,
      telemetry: 0.3,
      replay: 0.74,
      governance: 0.5
    }
  });

  assert.equal(result.decision, "freeze-certainty-claims");
  assert.equal(result.certificationBoundary, "non-certifying-epistemic-control");
});

test("live pilot scope blocks high authority categories and overbroad exposure", () => {
  const result = evaluateLivePilotScope({
    singleNeighborhood: false,
    residentCount: 420,
    responderCount: 30,
    operatorCount: 1,
    supervisorCount: 0,
    dailyOperationalHours: 9,
    shutdownAuthorityAssigned: false,
    auditTrailMandatory: false,
    rollbackPlanTested: false,
    permittedIncidentCategories: ["welfare-check", "armed-robbery", "kidnapping"]
  });

  assert.equal(result.scopeBand, "unsafe-live-scope");
  assert.equal(result.allowedMode, "do-not-operationalize");
  assert.ok(result.blockers.includes("high-authority-categories-not-earned"));
});

test("live telecom observation pauses unsafe telecom dependence", () => {
  const result = scoreLiveTelecomObservation({
    p95SmsLatencySeconds: 760,
    providerAsymmetryScore: 0.72,
    androidOemInconsistencyRate: 0.64,
    offlineSyncRestorationRate: 0.38,
    lowBatteryDeliveryFailureRate: 0.58,
    networkOscillationRate: 0.62,
    telecomSampleCompleteness: 0.5
  });

  assert.equal(result.telecomRealityBand, "unsafe");
  assert.equal(result.requiredAction, "pause-live-telecom-dependence");
});

test("human operational behavior reduces scope under live confusion", () => {
  const result = scoreHumanOperationalBehavior({
    operatorHesitationRate: 0.42,
    responderConfusionRate: 0.46,
    escalationInconsistencyRate: 0.48,
    panicMisuseRate: 0.22,
    fatigueAccumulationRate: 0.44,
    responderAbandonmentRate: 0.38,
    alertInterpretationDriftRate: 0.36
  });

  assert.equal(result.humanRiskBand, "unstable");
  assert.equal(result.requiredAction, "reduce-scope-and-increase-supervision");
});

test("governance friction blocks live pilot when authority is unclear", () => {
  const result = scoreGovernanceFriction({
    p95InstitutionalDelayMinutes: 80,
    approvalBottleneckRate: 0.7,
    authorityAmbiguityRate: 0.68,
    supervisorDisagreementRate: 0.62,
    escalationDisputeRate: 0.64,
    accountabilityFrictionRate: 0.66
  });

  assert.equal(result.governanceFrictionBand, "blocking");
  assert.equal(result.requiredAction, "pause-live-pilot-for-governance-review");
});

test("incident review completeness prevents weak incidents from becoming truth", () => {
  const result = evaluateIncidentReviewCompleteness({
    replayReviewCompleted: true,
    governanceReviewCompleted: true,
    responderReviewCompleted: false,
    telecomReviewCompleted: false,
    confusionReviewCompleted: true,
    modelDivergenceReviewCompleted: false,
    uncertaintyReviewCompleted: false
  });

  assert.equal(result.reviewBand, "unsafe-learning-record");
  assert.equal(result.requiredAction, "do-not-use-as-operational-truth");
});

test("live operationalization permits only low-risk observed learning", () => {
  const result = recommendLiveOperationalizationDecision({
    readinessGates: { field: false, stress: false, convergence: false },
    scope: {
      singleNeighborhood: true,
      residentCount: 90,
      responderCount: 8,
      operatorCount: 2,
      supervisorCount: 1,
      dailyOperationalHours: 3,
      shutdownAuthorityAssigned: true,
      auditTrailMandatory: true,
      rollbackPlanTested: true,
      permittedIncidentCategories: ["welfare-check", "low-severity-medical", "blackout-coordination", "flood-awareness"]
    },
    telecom: {
      p95SmsLatencySeconds: 210,
      providerAsymmetryScore: 0.18,
      androidOemInconsistencyRate: 0.16,
      offlineSyncRestorationRate: 0.82,
      lowBatteryDeliveryFailureRate: 0.12,
      networkOscillationRate: 0.16,
      telecomSampleCompleteness: 0.9
    },
    human: {
      operatorHesitationRate: 0.12,
      responderConfusionRate: 0.14,
      escalationInconsistencyRate: 0.1,
      panicMisuseRate: 0.08,
      fatigueAccumulationRate: 0.12,
      responderAbandonmentRate: 0.1,
      alertInterpretationDriftRate: 0.1
    },
    governance: {
      p95InstitutionalDelayMinutes: 18,
      approvalBottleneckRate: 0.12,
      authorityAmbiguityRate: 0.1,
      supervisorDisagreementRate: 0.08,
      escalationDisputeRate: 0.08,
      accountabilityFrictionRate: 0.1
    },
    incidentReviews: [
      {
        replayReviewCompleted: true,
        governanceReviewCompleted: true,
        responderReviewCompleted: true,
        telecomReviewCompleted: true,
        confusionReviewCompleted: true,
        modelDivergenceReviewCompleted: true,
        uncertaintyReviewCompleted: true
      }
    ]
  });

  assert.equal(result.decision, "limited-live-low-risk-observation");
  assert.deepEqual(result.failedReadinessGates, ["field-gate-failed", "stress-gate-failed", "convergence-gate-failed"]);
  assert.equal(result.certificationBoundary, "live-learning-is-not-readiness-certification");
});

test("long-duration operational drift detects slow degradation", () => {
  const result = modelOperationalDrift([
    { responderReliability: 0.9, operatorJudgmentErrorRate: 0.08, governanceInconsistencyRate: 0.08, telecomDegradationRate: 0.12, institutionalParticipationVolatility: 0.1, auditQualityScore: 0.92, p95EscalationMinutes: 12 },
    { responderReliability: 0.82, operatorJudgmentErrorRate: 0.16, governanceInconsistencyRate: 0.15, telecomDegradationRate: 0.2, institutionalParticipationVolatility: 0.18, auditQualityScore: 0.84, p95EscalationMinutes: 22 },
    { responderReliability: 0.72, operatorJudgmentErrorRate: 0.26, governanceInconsistencyRate: 0.26, telecomDegradationRate: 0.32, institutionalParticipationVolatility: 0.28, auditQualityScore: 0.72, p95EscalationMinutes: 36 }
  ]);

  assert.equal(result.driftBand, "severe-drift");
});

test("chronic degraded-state normalization freezes prolonged live operation", () => {
  const result = detectChronicDegradedNormalization(
    [
      { degradedModeHoursPerDay: 5, operatorDegradedComfortScore: 0.5, responderInstabilityAdaptationScore: 0.5, governanceToleranceScore: 0.45, delayedCoordinationAcceptanceRate: 0.4, operationalStandardsReductionRate: 0.3 },
      { degradedModeHoursPerDay: 6, operatorDegradedComfortScore: 0.6, responderInstabilityAdaptationScore: 0.62, governanceToleranceScore: 0.56, delayedCoordinationAcceptanceRate: 0.52, operationalStandardsReductionRate: 0.42 }
    ],
    { reportedMode: "normal" }
  );

  assert.equal(result.normalizationBand, "critical");
  assert.equal(result.requiredAction, "freeze-prolonged-live-operation");
});

test("human fatigue evolution detects accumulated operational strain", () => {
  const result = modelHumanFatigueEvolution([
    { alertExhaustionRate: 0.1, supervisorBurnoutRate: 0.08, cognitiveOverloadRate: 0.12, escalationAvoidanceRate: 0.08, trustReviewFatigueRate: 0.1, riskSignalDesensitizationRate: 0.06 },
    { alertExhaustionRate: 0.22, supervisorBurnoutRate: 0.2, cognitiveOverloadRate: 0.24, escalationAvoidanceRate: 0.18, trustReviewFatigueRate: 0.22, riskSignalDesensitizationRate: 0.16 },
    { alertExhaustionRate: 0.38, supervisorBurnoutRate: 0.34, cognitiveOverloadRate: 0.4, escalationAvoidanceRate: 0.32, trustReviewFatigueRate: 0.36, riskSignalDesensitizationRate: 0.28 }
  ]);

  assert.equal(result.fatigueBand, "severe-fatigue-drift");
});

test("telecom evolution detects deteriorating provider and device behavior", () => {
  const result = modelTelecomEvolution([
    { providerReliabilityScore: 0.86, outageGeographyRate: 0.08, seasonalCongestionScore: 0.12, p95SmsLatencySeconds: 160, androidFragmentationFailureRate: 0.08, deviceBatteryFailureRate: 0.1 },
    { providerReliabilityScore: 0.76, outageGeographyRate: 0.18, seasonalCongestionScore: 0.22, p95SmsLatencySeconds: 260, androidFragmentationFailureRate: 0.2, deviceBatteryFailureRate: 0.18 },
    { providerReliabilityScore: 0.62, outageGeographyRate: 0.32, seasonalCongestionScore: 0.38, p95SmsLatencySeconds: 420, androidFragmentationFailureRate: 0.34, deviceBatteryFailureRate: 0.32 }
  ]);

  assert.equal(result.telecomEvolutionBand, "unstable");
});

test("field governance durability detects slow governance erosion", () => {
  const result = validateFieldGovernanceDurability([
    { institutionalParticipationRate: 0.88, supervisorInconsistencyRate: 0.08, auditCompletionRate: 0.92, policyAdherenceRate: 0.9, emergencyAuthorityMisuseRate: 0.02, governanceShortcutRate: 0.06 },
    { institutionalParticipationRate: 0.74, supervisorInconsistencyRate: 0.2, auditCompletionRate: 0.78, policyAdherenceRate: 0.76, emergencyAuthorityMisuseRate: 0.08, governanceShortcutRate: 0.18 },
    { institutionalParticipationRate: 0.56, supervisorInconsistencyRate: 0.36, auditCompletionRate: 0.58, policyAdherenceRate: 0.54, emergencyAuthorityMisuseRate: 0.16, governanceShortcutRate: 0.34 }
  ]);

  assert.equal(result.governanceDecayBand, "failing");
});

test("trust erosion and continuity fragility restrict long-duration operation", () => {
  const trust = modelTrustErosion([
    { residentTrustScore: 0.84, responderAbandonmentRate: 0.08, falseAlertImpactRate: 0.08, coordinationDisappointmentRate: 0.1, institutionalSkepticismRate: 0.12 },
    { residentTrustScore: 0.72, responderAbandonmentRate: 0.18, falseAlertImpactRate: 0.16, coordinationDisappointmentRate: 0.22, institutionalSkepticismRate: 0.24 },
    { residentTrustScore: 0.58, responderAbandonmentRate: 0.32, falseAlertImpactRate: 0.3, coordinationDisappointmentRate: 0.38, institutionalSkepticismRate: 0.42 }
  ]);
  const continuity = assessContinuityResilience({
    staffingContinuityScore: 0.28,
    supervisorSuccessionReadiness: 0.24,
    supervisorReplacementImpactRate: 0.78,
    singleInstitutionDependencyRate: 0.82,
    localizedKnowledgeConcentrationRate: 0.86
  });

  assert.equal(trust.trustErosionBand, "eroding");
  assert.equal(continuity.continuityBand, "fragile");
});

test("field evolution posture freezes prolonged operation under slow decay", () => {
  const result = recommendFieldEvolutionPosture({
    series: [
      { responderReliability: 0.9, operatorJudgmentErrorRate: 0.08, governanceInconsistencyRate: 0.08, telecomDegradationRate: 0.12, institutionalParticipationVolatility: 0.1, auditQualityScore: 0.92, p95EscalationMinutes: 12, degradedModeHoursPerDay: 5, operatorDegradedComfortScore: 0.5, responderInstabilityAdaptationScore: 0.5, governanceToleranceScore: 0.45, delayedCoordinationAcceptanceRate: 0.4, operationalStandardsReductionRate: 0.3, alertExhaustionRate: 0.1, supervisorBurnoutRate: 0.08, cognitiveOverloadRate: 0.12, escalationAvoidanceRate: 0.08, trustReviewFatigueRate: 0.1, riskSignalDesensitizationRate: 0.06, providerReliabilityScore: 0.86, outageGeographyRate: 0.08, seasonalCongestionScore: 0.12, androidFragmentationFailureRate: 0.08, deviceBatteryFailureRate: 0.1, institutionalParticipationRate: 0.88, supervisorInconsistencyRate: 0.08, auditCompletionRate: 0.92, policyAdherenceRate: 0.9, emergencyAuthorityMisuseRate: 0.02, governanceShortcutRate: 0.06, residentTrustScore: 0.84, responderAbandonmentRate: 0.08, falseAlertImpactRate: 0.08, coordinationDisappointmentRate: 0.1, institutionalSkepticismRate: 0.12 },
      { responderReliability: 0.72, operatorJudgmentErrorRate: 0.26, governanceInconsistencyRate: 0.26, telecomDegradationRate: 0.32, institutionalParticipationVolatility: 0.28, auditQualityScore: 0.72, p95EscalationMinutes: 36, degradedModeHoursPerDay: 6, operatorDegradedComfortScore: 0.62, responderInstabilityAdaptationScore: 0.64, governanceToleranceScore: 0.58, delayedCoordinationAcceptanceRate: 0.54, operationalStandardsReductionRate: 0.46, alertExhaustionRate: 0.38, supervisorBurnoutRate: 0.34, cognitiveOverloadRate: 0.4, escalationAvoidanceRate: 0.32, trustReviewFatigueRate: 0.36, riskSignalDesensitizationRate: 0.28, providerReliabilityScore: 0.62, outageGeographyRate: 0.32, seasonalCongestionScore: 0.38, androidFragmentationFailureRate: 0.34, deviceBatteryFailureRate: 0.32, institutionalParticipationRate: 0.56, supervisorInconsistencyRate: 0.36, auditCompletionRate: 0.58, policyAdherenceRate: 0.54, emergencyAuthorityMisuseRate: 0.16, governanceShortcutRate: 0.34, residentTrustScore: 0.58, responderAbandonmentRate: 0.32, falseAlertImpactRate: 0.3, coordinationDisappointmentRate: 0.38, institutionalSkepticismRate: 0.42 }
    ],
    narrative: { reportedMode: "normal" },
    continuity: {
      staffingContinuityScore: 0.42,
      supervisorSuccessionReadiness: 0.38,
      supervisorReplacementImpactRate: 0.64,
      singleInstitutionDependencyRate: 0.7,
      localizedKnowledgeConcentrationRate: 0.72
    }
  });

  assert.equal(result.posture, "freeze-prolonged-live-operation");
  assert.equal(result.certificationBoundary, "long-duration-operation-is-not-readiness-certification");
});

test("uncertainty visibility explains incomplete and contradictory evidence", () => {
  const result = surfaceUncertainty({
    incompleteInformationRate: 0.4,
    confidenceVolatility: 0.35,
    contradictoryObservationRate: 0.22,
    telecomUncertainty: 0.5,
    operationalAmbiguityRate: 0.25,
    degradedStateActive: true,
    unresolvedIncidentCount: 2
  });

  assert.equal(result.uncertaintyBand, "high");
  assert.equal(result.certaintyLanguageAllowed, false);
  assert.ok(result.plainLanguage.includes("telecom delivery is uncertain"));
});

test("decision explanation refuses action without false certainty", () => {
  const result = buildDecisionExplanation({
    actionType: "shutdown",
    refusedAction: "live dispatch",
    reasons: ["telecom confidence is unsafe", "operator review is incomplete"],
    constraints: ["manual review required", "failed convergence gate"],
    uncertainty: {
      telecomUncertainty: 0.6,
      contradictoryObservationRate: 0.2,
      degradedStateActive: true
    }
  });

  assert.equal(result.title, "Shutdown recommendation");
  assert.equal(result.confidenceDisplay, "uncertain-do-not-present-as-certain");
  assert.ok(result.operatorMessage.includes("failed convergence gate"));
});

test("governance interpretation withholds certification transparently", () => {
  const result = explainGovernanceAction({
    name: "pilot-expansion-review",
    recommendation: "freeze-expansion",
    certificationWithheld: true,
    reasons: ["stress gate failed", "audit trace incomplete"],
    restrictions: ["no high-authority workflows"],
    reviewPath: "pilot-governance-board"
  });

  assert.equal(result.expansionAllowed, false);
  assert.equal(result.auditRequired, true);
  assert.ok(result.plainLanguage.includes("withheld"));
});

test("community trust notice reinforces anti-surveillance boundaries", () => {
  const result = buildCommunityTrustNotice();

  assert.ok(result.dataNotCollected.includes("facial recognition"));
  assert.ok(result.dataNotCollected.includes("continuous tracking"));
  assert.ok(result.automationBoundary.includes("human governance"));
});

test("conflicting reality communication requires human review", () => {
  const result = compareConflictingReality({
    sources: {
      operator: 0.82,
      responder: 0.34,
      telemetry: 0.45,
      replay: 0.78
    },
    telecomInconsistent: true
  });

  assert.equal(result.realityState, "unresolved-or-conflicting");
  assert.equal(result.requiredAction, "show-conflict-and-require-human-review");
});

test("accountability trace blocks finalization when approvals are missing", () => {
  const result = buildAccountabilityTrace({
    traceId: "trace-1",
    reason: "telecom uncertainty",
    constraints: ["manual review"],
    assumptions: ["SMS receipt may be delayed"]
  });

  assert.equal(result.traceBand, "not-accountable");
  assert.equal(result.requiredAction, "do-not-finalize-action");
});

test("civic legibility assessment blocks opaque automation under uncertainty", () => {
  const result = assessCivicLegibility({
    readinessGatesFailed: true,
    dashboardShowsPreciseConfidence: true,
    autoActionAllowed: true,
    decision: {
      actionType: "uncertaintyFreeze",
      recommendedAction: "hold live escalation",
      reasons: ["conflicting telemetry", "telecom receipts delayed"],
      constraints: ["manual supervisor review"],
      uncertainty: {
        incompleteInformationRate: 0.5,
        confidenceVolatility: 0.4,
        telecomUncertainty: 0.6,
        degradedStateActive: true
      }
    },
    governance: {
      recommendation: "freeze-expansion",
      certificationWithheld: true,
      reasons: ["readiness gates failed"],
      restrictions: ["no expansion"]
    },
    conflictingReality: {
      sources: { operator: 0.9, responder: 0.3, telemetry: 0.4 },
      telecomInconsistent: true
    },
    trace: {
      traceId: "trace-2",
      reason: "uncertainty freeze"
    }
  });

  assert.equal(result.legibilityBand, "unsafe-opaque");
  assert.equal(result.requiredAction, "pause-action-and-restore-legibility");
  assert.equal(result.certificationBoundary, "legibility-explains-decisions-but-does-not-certify-readiness");
});

test("power concentration detection freezes authority expansion", () => {
  const result = detectPowerConcentration({
    authorityAccumulationRate: 0.82,
    hiddenOverrideExpansionRate: 0.74,
    supervisorOverreachRate: 0.68,
    governanceBypassAttemptRate: 0.76,
    centralizedApprovalDependency: 0.72,
    institutionalControlConcentration: 0.8
  });

  assert.equal(result.powerBand, "critical-centralization");
  assert.equal(result.requiredAction, "freeze-authority-expansion");
});

test("surveillance drift detection blocks data expansion", () => {
  const result = detectSurveillanceDrift({
    unauthorizedRetentionRate: 0.72,
    operationalScopeCreepRate: 0.68,
    excessTelemetryExpansionRate: 0.7,
    hiddenTrackingIncentiveRate: 0.74,
    nonExpiringLocationStorageRate: 0.66,
    identityOverCollectionRate: 0.62,
    crossIncidentProfilingPressure: 0.64
  });

  assert.equal(result.driftBand, "surveillance-risk");
  assert.equal(result.requiredAction, "freeze-data-expansion-and-delete-unauthorized-data");
});

test("governance bypass resistance invalidates unreviewed authority", () => {
  const result = resistGovernanceBypass({
    undocumentedOverrideRate: 0.7,
    emergencyPowerAbuseRate: 0.66,
    operatorShortcutEscalationRate: 0.58,
    hiddenAdminAuthorityRate: 0.72,
    silentPolicyModificationRate: 0.68,
    unreviewedSupervisorInterventionRate: 0.7
  });

  assert.equal(result.bypassBand, "active-bypass");
  assert.equal(result.requiredAction, "invalidate-unreviewed-authority-and-freeze");
});

test("political pressure model activates independent review", () => {
  const result = modelPoliticalPressure({
    politicalEscalationPressure: 0.7,
    selectivePrioritizationAttemptRate: 0.74,
    institutionalFavoritismRate: 0.62,
    suppressionIncentiveRate: 0.78,
    reputationManipulationRequestRate: 0.66,
    narrativeControlPressure: 0.72
  });

  assert.equal(result.pressureBand, "coercive-pressure");
  assert.equal(result.requiredAction, "activate-independent-review-and-freeze-discretionary-actions");
});

test("rights preservation blocks operation when privacy and review fail", () => {
  const result = enforceRightsPreservation({
    dataMinimizationScore: 0.5,
    authorityReversibilityScore: 0.55,
    auditabilityScore: 0.6,
    interventionExplainabilityScore: 0.58,
    automationConstraintScore: 0.62,
    independentReviewabilityScore: 0.5,
    residentPrivacyBoundaryScore: 0.6,
    responderConsentBoundaryScore: 0.58,
    telemetryExpirationScore: 0.5,
    identityLinkageConstraintScore: 0.52
  });

  assert.equal(result.rightsBand, "rights-unsafe");
  assert.equal(result.requiredAction, "stop-operation-until-rights-controls-restored");
});

test("oversight architecture blocks exceptional authority without distributed review", () => {
  const result = assessOversightArchitecture({
    multiPartyReviewRequired: false,
    distributedGovernanceVisibility: false,
    supervisorAccountabilityChain: true,
    independentAuditPathway: false,
    conflictOfInterestDisclosure: false,
    overrideTransparency: false
  });

  assert.equal(result.oversightBand, "unsafe-oversight");
  assert.equal(result.requiredAction, "do-not-allow-exceptional-authority");
});

test("civic integrity posture freezes coercive institutional drift", () => {
  const result = recommendCivicIntegrityPosture({
    power: {
      authorityAccumulationRate: 0.82,
      hiddenOverrideExpansionRate: 0.74,
      supervisorOverreachRate: 0.68,
      governanceBypassAttemptRate: 0.76,
      centralizedApprovalDependency: 0.72,
      institutionalControlConcentration: 0.8
    },
    surveillance: {
      unauthorizedRetentionRate: 0.72,
      operationalScopeCreepRate: 0.68,
      excessTelemetryExpansionRate: 0.7,
      hiddenTrackingIncentiveRate: 0.74,
      nonExpiringLocationStorageRate: 0.66,
      identityOverCollectionRate: 0.62,
      crossIncidentProfilingPressure: 0.64
    },
    bypass: {
      undocumentedOverrideRate: 0.7,
      emergencyPowerAbuseRate: 0.66,
      operatorShortcutEscalationRate: 0.58,
      hiddenAdminAuthorityRate: 0.72,
      silentPolicyModificationRate: 0.68,
      unreviewedSupervisorInterventionRate: 0.7
    },
    political: {
      politicalEscalationPressure: 0.7,
      selectivePrioritizationAttemptRate: 0.74,
      institutionalFavoritismRate: 0.62,
      suppressionIncentiveRate: 0.78,
      reputationManipulationRequestRate: 0.66,
      narrativeControlPressure: 0.72
    },
    rights: {
      dataMinimizationScore: 0.5,
      authorityReversibilityScore: 0.55,
      auditabilityScore: 0.6,
      interventionExplainabilityScore: 0.58,
      automationConstraintScore: 0.62,
      independentReviewabilityScore: 0.5,
      residentPrivacyBoundaryScore: 0.6,
      responderConsentBoundaryScore: 0.58,
      telemetryExpirationScore: 0.5,
      identityLinkageConstraintScore: 0.52
    },
    oversight: {
      multiPartyReviewRequired: false,
      distributedGovernanceVisibility: false,
      supervisorAccountabilityChain: true,
      independentAuditPathway: false,
      conflictOfInterestDisclosure: false,
      overrideTransparency: false
    }
  });

  assert.equal(result.posture, "civic-integrity-freeze");
  assert.equal(result.certificationBoundary, "civic-integrity-restricts-power-but-does-not-certify-readiness");
});

test("long-horizon sustainability modeling freezes weak operating base", () => {
  const result = modelLongHorizonSustainability({
    maintenanceContinuityScore: 0.32,
    organizationalSuccessionReadiness: 0.28,
    staffingDurabilityScore: 0.34,
    infrastructureAgingRisk: 0.74,
    operationalDecayRate: 0.68,
    documentationContinuityScore: 0.4
  });

  assert.equal(result.sustainabilityBand, "unsustainable");
  assert.equal(result.requiredAction, "freeze-expansion-and-rebuild-operating-base");
});

test("economic survivability detects unaffordable telecom and maintenance burden", () => {
  const result = evaluateEconomicSurvivability({
    telecomCostGrowthRate: 0.72,
    smsCostExpansionRate: 0.76,
    infrastructureCostGrowthRate: 0.62,
    responderSupportBurdenRate: 0.58,
    institutionalFundingVolatility: 0.7,
    civicDependencyBurdenRate: 0.66,
    maintenanceAffordabilityScore: 0.32
  });

  assert.equal(result.economicBand, "economically-unsustainable");
  assert.equal(result.requiredAction, "pause-cost-expanding-operations");
});

test("operator and governance fatigue catches shortcut normalization", () => {
  const result = modelOperatorGovernanceFatigue({
    chronicOperationalExhaustionRate: 0.68,
    governanceReviewFatigueRate: 0.74,
    institutionalComplacencyRate: 0.62,
    oversightDegradationRate: 0.7,
    humanShortcutNormalizationRate: 0.66,
    proceduralAbandonmentRate: 0.58
  });

  assert.equal(result.fatigueBand, "burnout-critical");
});

test("community trust evolution detects legitimacy crisis", () => {
  const result = modelCommunityTrustEvolution({
    trustAccumulationScore: 0.22,
    trustErosionRate: 0.7,
    expectationInflationRate: 0.66,
    disappointmentMemoryRate: 0.72,
    rumorPropagationRate: 0.64,
    perceivedBiasRate: 0.68,
    fearAmplificationRate: 0.58,
    civicLegitimacyDriftRate: 0.62
  });

  assert.equal(result.trustBand, "legitimacy-crisis");
});

test("dependency fragility detects concentrated infrastructure risk", () => {
  const result = analyzeDependencyFragility({
    telecomProviderDependencyRate: 0.82,
    cloudProviderDependencyRate: 0.68,
    institutionalPartnershipFragility: 0.74,
    smsGatewayConcentrationRisk: 0.8,
    regionalInfrastructureAsymmetry: 0.7,
    operatorTurnoverRisk: 0.64
  });

  assert.equal(result.dependencyBand, "critical-dependency");
});

test("sustainable governance and minimalism resist organizational decay", () => {
  const governance = evaluateSustainableGovernance({
    renewableOversightScore: 0.34,
    governanceSuccessionContinuity: 0.28,
    rotatingAccountabilityScore: 0.32,
    institutionalMemoryPreservation: 0.36,
    auditContinuityScore: 0.3,
    distributedReviewDurability: 0.34
  });
  const minimalism = assessInfrastructureMinimalism({
    operationalComplexityScore: 0.72,
    unnecessaryFeatureGrowthRate: 0.68,
    maintenanceBurdenAccumulation: 0.74,
    governanceSurfaceExpansionRate: 0.66,
    hiddenOperationalDebtRate: 0.7
  });

  assert.equal(governance.governanceBand, "governance-unsustainable");
  assert.equal(minimalism.minimalismBand, "complexity-unsustainable");
});

test("cultural adaptation and recovery sustainability expose long-term fragility", () => {
  const cultural = modelCulturalAdaptation({
    regionalAdoptionVariance: 0.7,
    localTrustBehaviorVariance: 0.66,
    civicParticipationVariance: 0.62,
    informalCoordinationMismatchRate: 0.72,
    languageInterpretationGapRate: 0.68,
    adaptationIntegrityLossRisk: 0.74
  });
  const recovery = modelRecoverySustainability({
    repeatedCrisisRecoveryFatigue: 0.72,
    degradedStateNormalizationRate: 0.68,
    longTermRollbackExhaustionRate: 0.64,
    chronicInstabilityAdaptationRate: 0.7,
    institutionalRecoveryExhaustion: 0.74
  });

  assert.equal(cultural.adaptationBand, "adaptation-unsafe");
  assert.equal(recovery.recoveryBand, "recovery-unsustainable");
});

test("civic sustainability posture freezes unsustainable long-horizon operation", () => {
  const result = recommendCivicSustainabilityPosture({
    longHorizon: { maintenanceContinuityScore: 0.32, organizationalSuccessionReadiness: 0.28, staffingDurabilityScore: 0.34, infrastructureAgingRisk: 0.74, operationalDecayRate: 0.68, documentationContinuityScore: 0.4 },
    economic: { telecomCostGrowthRate: 0.72, smsCostExpansionRate: 0.76, infrastructureCostGrowthRate: 0.62, responderSupportBurdenRate: 0.58, institutionalFundingVolatility: 0.7, civicDependencyBurdenRate: 0.66, maintenanceAffordabilityScore: 0.32 },
    fatigue: { chronicOperationalExhaustionRate: 0.68, governanceReviewFatigueRate: 0.74, institutionalComplacencyRate: 0.62, oversightDegradationRate: 0.7, humanShortcutNormalizationRate: 0.66, proceduralAbandonmentRate: 0.58 },
    trust: { trustAccumulationScore: 0.22, trustErosionRate: 0.7, expectationInflationRate: 0.66, disappointmentMemoryRate: 0.72, rumorPropagationRate: 0.64, perceivedBiasRate: 0.68, fearAmplificationRate: 0.58, civicLegitimacyDriftRate: 0.62 },
    dependency: { telecomProviderDependencyRate: 0.82, cloudProviderDependencyRate: 0.68, institutionalPartnershipFragility: 0.74, smsGatewayConcentrationRisk: 0.8, regionalInfrastructureAsymmetry: 0.7, operatorTurnoverRisk: 0.64 },
    governance: { renewableOversightScore: 0.34, governanceSuccessionContinuity: 0.28, rotatingAccountabilityScore: 0.32, institutionalMemoryPreservation: 0.36, auditContinuityScore: 0.3, distributedReviewDurability: 0.34 },
    minimalism: { operationalComplexityScore: 0.72, unnecessaryFeatureGrowthRate: 0.68, maintenanceBurdenAccumulation: 0.74, governanceSurfaceExpansionRate: 0.66, hiddenOperationalDebtRate: 0.7 },
    cultural: { regionalAdoptionVariance: 0.7, localTrustBehaviorVariance: 0.66, civicParticipationVariance: 0.62, informalCoordinationMismatchRate: 0.72, languageInterpretationGapRate: 0.68, adaptationIntegrityLossRisk: 0.74 },
    recovery: { repeatedCrisisRecoveryFatigue: 0.72, degradedStateNormalizationRate: 0.68, longTermRollbackExhaustionRate: 0.64, chronicInstabilityAdaptationRate: 0.7, institutionalRecoveryExhaustion: 0.74 }
  });

  assert.equal(result.posture, "sustainability-freeze");
  assert.equal(result.certificationBoundary, "sustainability-supports-survivability-but-does-not-certify-readiness");
});

test("mission drift detection freezes identity failure", () => {
  const result = detectMissionDrift({
    purposeExpansionRate: 0.72,
    silentFeatureCreepRate: 0.66,
    authorityScopeGrowthRate: 0.76,
    governanceDilutionRate: 0.7,
    operationalOverreachRate: 0.68,
    infrastructureIdentityErosionRate: 0.74
  });

  assert.equal(result.driftBand, "identity-failure");
  assert.equal(result.requiredAction, "freeze-evolution-and-reaffirm-civic-purpose");
});

test("adaptive legitimacy modeling detects public legitimacy crisis", () => {
  const result = modelAdaptiveLegitimacy({
    publicExpectationShiftRate: 0.7,
    civicNormShiftRate: 0.66,
    institutionalTrustShiftRate: 0.72,
    generationalPerceptionGapRate: 0.64,
    regionalLegitimacyVariance: 0.7,
    longTermReputationVolatility: 0.74
  });

  assert.equal(result.legitimacyBand, "legitimacy-crisis");
});

test("technology expansion restraint blocks over-automation and biometric pressure", () => {
  const result = restrainTechnologyExpansion({
    aiOverAutomationPressure: 0.72,
    predictiveGovernanceIncentive: 0.74,
    excessTelemetryDependence: 0.64,
    biometricExpansionPressure: 0.76,
    automatedAuthorityEscalationRate: 0.7,
    optimizationDrivenSurveillanceDrift: 0.68
  });

  assert.equal(result.technologyBand, "technology-overreach");
  assert.equal(result.requiredAction, "freeze-technology-expansion");
});

test("complexity control detects unmanageable civic complexity", () => {
  const result = controlComplexityAccumulation({
    governanceSurfaceExpansionRate: 0.72,
    operationalDependencyGrowthRate: 0.7,
    maintenanceBurdenInflationRate: 0.74,
    institutionalCoordinationOverloadRate: 0.66,
    hiddenArchitecturalFragilityRate: 0.76
  });

  assert.equal(result.complexityBand, "unmanageable-complexity");
});

test("principle preservation blocks evolution when founding principles fail", () => {
  const result = preserveFoundingPrinciples({
    minimumNecessaryAuthorityScore: 0.62,
    reversibleDeploymentScore: 0.58,
    uncertaintyVisibilityScore: 0.6,
    humanAccountabilityScore: 0.64,
    operationalRestraintScore: 0.56,
    privacyBoundaryScore: 0.6,
    explainableGovernanceScore: 0.62
  });

  assert.equal(result.principleBand, "principles-broken");
  assert.equal(result.requiredAction, "freeze-evolution-and-restore-principles");
});

test("societal alignment checks detect community misalignment", () => {
  const result = checkSocietalAlignment({
    communityPerceivedValueScore: 0.32,
    livedRealityFitScore: 0.3,
    governanceUnderstandabilityScore: 0.34,
    operatorTrustScore: 0.38,
    institutionalParticipationHealth: 0.36
  });

  assert.equal(result.alignmentBand, "misaligned");
});

test("evolutionary oversight and permanent emergency checks block exceptional governance", () => {
  const oversight = assessEvolutionaryOversight({
    periodicLegitimacyReview: false,
    externalCivicReviewPathway: false,
    governanceRenewalCheckpoint: false,
    institutionalDriftAudit: false,
    principleComplianceReview: true,
    infrastructureSimplificationReview: false
  });
  const emergency = detectPermanentEmergency({
    exceptionalPowerNormalizationRate: 0.72,
    endlessDegradedGovernanceRate: 0.68,
    perpetualEmergencyAuthorityRate: 0.76,
    escalationHabituationRate: 0.66,
    chronicOperatorOverrideCultureRate: 0.7
  });

  assert.equal(oversight.oversightBand, "oversight-insufficient");
  assert.equal(emergency.emergencyBand, "permanent-emergency-risk");
});

test("adaptive legitimacy posture freezes evolution under identity and principle failure", () => {
  const result = recommendAdaptiveLegitimacyPosture({
    mission: { purposeExpansionRate: 0.72, silentFeatureCreepRate: 0.66, authorityScopeGrowthRate: 0.76, governanceDilutionRate: 0.7, operationalOverreachRate: 0.68, infrastructureIdentityErosionRate: 0.74 },
    legitimacy: { publicExpectationShiftRate: 0.7, civicNormShiftRate: 0.66, institutionalTrustShiftRate: 0.72, generationalPerceptionGapRate: 0.64, regionalLegitimacyVariance: 0.7, longTermReputationVolatility: 0.74 },
    technology: { aiOverAutomationPressure: 0.72, predictiveGovernanceIncentive: 0.74, excessTelemetryDependence: 0.64, biometricExpansionPressure: 0.76, automatedAuthorityEscalationRate: 0.7, optimizationDrivenSurveillanceDrift: 0.68 },
    complexity: { governanceSurfaceExpansionRate: 0.72, operationalDependencyGrowthRate: 0.7, maintenanceBurdenInflationRate: 0.74, institutionalCoordinationOverloadRate: 0.66, hiddenArchitecturalFragilityRate: 0.76 },
    principles: { minimumNecessaryAuthorityScore: 0.62, reversibleDeploymentScore: 0.58, uncertaintyVisibilityScore: 0.6, humanAccountabilityScore: 0.64, operationalRestraintScore: 0.56, privacyBoundaryScore: 0.6, explainableGovernanceScore: 0.62 },
    alignment: { communityPerceivedValueScore: 0.32, livedRealityFitScore: 0.3, governanceUnderstandabilityScore: 0.34, operatorTrustScore: 0.38, institutionalParticipationHealth: 0.36 },
    oversight: { periodicLegitimacyReview: false, externalCivicReviewPathway: false, governanceRenewalCheckpoint: false, institutionalDriftAudit: false, principleComplianceReview: true, infrastructureSimplificationReview: false },
    emergency: { exceptionalPowerNormalizationRate: 0.72, endlessDegradedGovernanceRate: 0.68, perpetualEmergencyAuthorityRate: 0.76, escalationHabituationRate: 0.66, chronicOperatorOverrideCultureRate: 0.7 }
  });

  assert.equal(result.posture, "adaptive-legitimacy-freeze");
  assert.equal(result.certificationBoundary, "adaptive-legitimacy-guides-evolution-but-does-not-certify-readiness");
});

test("civilizational stability detects destabilizing social effects", () => {
  const result = modelCivilizationalStability({
    communityStabilizationScore: 0.22,
    panicReductionScore: 0.2,
    coordinationResilienceScore: 0.3,
    institutionalTrustStrengtheningScore: 0.24,
    civicContinuityScore: 0.28,
    socialCohesionScore: 0.26,
    fearAmplificationRate: 0.72,
    dependencyFragilityIncrease: 0.7,
    authorityCentralizationPressure: 0.74,
    informalResilienceWeakeningRate: 0.68,
    publicAnxietyRate: 0.66,
    coordinationMonocultureRisk: 0.7
  });

  assert.equal(result.stabilityBand, "destabilizing");
  assert.equal(result.requiredAction, "pause-and-redesign-for-social-stability");
});

test("panic information dynamics detects trust collapse cascade risk", () => {
  const result = modelMassPanicInformationDynamics({
    rumorPropagationRate: 0.74,
    misinformationAmplificationRate: 0.7,
    panicEscalationLoopRate: 0.72,
    falseAlertContagionRate: 0.68,
    trustCollapseCascadeRisk: 0.76,
    institutionalConfusionRate: 0.66
  });

  assert.equal(result.panicBand, "panic-cascade-risk");
});

test("dependency balance detects resilience undermining over-dependence", () => {
  const result = balanceDependencyResilience({
    overDependenceRate: 0.76,
    localInitiativeReductionRate: 0.7,
    behavioralPassivityRate: 0.68,
    institutionalRelianceImbalance: 0.72,
    coordinationMonocultureRisk: 0.74,
    communityFallbackWeakness: 0.66
  });

  assert.equal(result.dependencyBand, "dependency-undermines-resilience");
});

test("societal behavioral adaptation detects distorted emergency behavior", () => {
  const result = modelSocietalBehaviorAdaptation({
    communityBehaviorDistortionRate: 0.68,
    responderCultureDriftRate: 0.66,
    governanceBehaviorShiftRate: 0.72,
    operatorAuthorityPsychologyRisk: 0.7,
    expectationNormalizationRisk: 0.74,
    emergencyBehaviorDistortionRate: 0.68
  });

  assert.equal(result.adaptationBand, "behavioral-distortion");
});

test("intergenerational legitimacy and institutions detect future civic fragility", () => {
  const generations = assessIntergenerationalLegitimacy({
    futureGenerationTrustScore: 0.28,
    governanceUnderstandabilityOverTime: 0.3,
    civicNormAssumptionDriftRate: 0.72,
    legitimacyPersistenceRisk: 0.7,
    societalTransformationMismatch: 0.68
  });
  const institutions = modelInstitutionalInteractionDynamics({
    institutionalDependencyRate: 0.72,
    institutionalComplacencyRate: 0.68,
    interAgencyCompetitionRate: 0.7,
    authorityConflictRate: 0.74,
    governanceFragmentationRate: 0.72,
    crisisCoordinationPoliticsRate: 0.7
  });

  assert.equal(generations.legitimacyBand, "future-legitimacy-unsafe");
  assert.equal(institutions.interactionBand, "institutional-conflict-risk");
});

test("resilience amplification and systemic failure containment remain explicit", () => {
  const resilience = amplifyCivicResilience({
    localCoordinationStrengthening: 0.24,
    communityInitiativeSupport: 0.2,
    humanPreparednessImprovement: 0.26,
    distributedResilienceIncrease: 0.22,
    decentralizedProblemSolvingPreservation: 0.2,
    localFallbackTrainingScore: 0.18
  });
  const containment = containSystemicFailure({
    infrastructureFailureDestabilizationRisk: 0.76,
    degradedModePanicRisk: 0.7,
    expectationCollapseDistrustRisk: 0.74,
    institutionalDependencyCascadeRisk: 0.72,
    safeFailureModeScore: 0.24
  });

  assert.equal(resilience.amplificationBand, "not-amplifying");
  assert.equal(containment.containmentBand, "unsafe-systemic-failure-risk");
});

test("civilizational stability posture freezes destabilizing systemic interaction", () => {
  const result = recommendCivilizationalStabilityPosture({
    stability: { communityStabilizationScore: 0.22, panicReductionScore: 0.2, coordinationResilienceScore: 0.3, institutionalTrustStrengtheningScore: 0.24, civicContinuityScore: 0.28, socialCohesionScore: 0.26, fearAmplificationRate: 0.72, dependencyFragilityIncrease: 0.7, authorityCentralizationPressure: 0.74, informalResilienceWeakeningRate: 0.68, publicAnxietyRate: 0.66, coordinationMonocultureRisk: 0.7 },
    panic: { rumorPropagationRate: 0.74, misinformationAmplificationRate: 0.7, panicEscalationLoopRate: 0.72, falseAlertContagionRate: 0.68, trustCollapseCascadeRisk: 0.76, institutionalConfusionRate: 0.66 },
    dependency: { overDependenceRate: 0.76, localInitiativeReductionRate: 0.7, behavioralPassivityRate: 0.68, institutionalRelianceImbalance: 0.72, coordinationMonocultureRisk: 0.74, communityFallbackWeakness: 0.66 },
    behavior: { communityBehaviorDistortionRate: 0.68, responderCultureDriftRate: 0.66, governanceBehaviorShiftRate: 0.72, operatorAuthorityPsychologyRisk: 0.7, expectationNormalizationRisk: 0.74, emergencyBehaviorDistortionRate: 0.68 },
    intergenerational: { futureGenerationTrustScore: 0.28, governanceUnderstandabilityOverTime: 0.3, civicNormAssumptionDriftRate: 0.72, legitimacyPersistenceRisk: 0.7, societalTransformationMismatch: 0.68 },
    institutions: { institutionalDependencyRate: 0.72, institutionalComplacencyRate: 0.68, interAgencyCompetitionRate: 0.7, authorityConflictRate: 0.74, governanceFragmentationRate: 0.72, crisisCoordinationPoliticsRate: 0.7 },
    resilience: { localCoordinationStrengthening: 0.24, communityInitiativeSupport: 0.2, humanPreparednessImprovement: 0.26, distributedResilienceIncrease: 0.22, decentralizedProblemSolvingPreservation: 0.2, localFallbackTrainingScore: 0.18 },
    containment: { infrastructureFailureDestabilizationRisk: 0.76, degradedModePanicRisk: 0.7, expectationCollapseDistrustRisk: 0.74, institutionalDependencyCascadeRisk: 0.72, safeFailureModeScore: 0.24 }
  });

  assert.equal(result.posture, "civilizational-stability-freeze");
  assert.equal(result.certificationBoundary, "civilizational-stability-guides-societal-impact-but-does-not-certify-readiness");
});

test("irreversibility risk detects societal lock-in", () => {
  const result = modelIrreversibilityRisk({
    societalDependencyAccumulation: 0.78,
    institutionalLockInRate: 0.74,
    coordinationMonocultureFormation: 0.76,
    operationalIrreversibilityRisk: 0.72,
    replacementImpossibilityRisk: 0.7,
    overCentralizedEmergencyReliance: 0.74
  });

  assert.equal(result.irreversibilityBand, "irreversible-dependency");
  assert.equal(result.requiredAction, "freeze-and-reduce-societal-dependency");
});

test("civic self sufficiency exposes collapsed non-platform capability", () => {
  const result = preserveCivicSelfSufficiency({
    localInitiativeScore: 0.24,
    decentralizedCoordinationScore: 0.22,
    offlineCommunityCapabilityScore: 0.24,
    independentInstitutionalCompetence: 0.26,
    nonPlatformEmergencyPathwayScore: 0.2,
    manualFallbackGovernanceScore: 0.22
  });

  assert.equal(result.selfSufficiencyBand, "self-sufficiency-collapsed");
  assert.equal(result.requiredAction, "freeze-and-restore-non-platform-capability");
});

test("failure survivability detects unsafe platform collapse", () => {
  const result = modelFailureSurvivability({
    catastrophicShutdownDestabilizationRisk: 0.76,
    telecomCollapseImpact: 0.7,
    governanceCollapseImpact: 0.74,
    institutionalWithdrawalImpact: 0.72,
    cloudProviderDisappearanceImpact: 0.7,
    operatorAbandonmentImpact: 0.68,
    publicTrustCollapseImpact: 0.76
  });

  assert.equal(result.survivabilityBand, "unsafe-failure");
  assert.equal(result.requiredAction, "freeze-and-design-safe-collapse-paths");
});

test("anti-monopoly coordination detects single-system dependence", () => {
  const result = protectAntiMonopolyCoordination({
    singleSystemEmergencyDependence: 0.76,
    coordinationMonopolizationRisk: 0.74,
    institutionalOverCentralizationRate: 0.72,
    platformExclusiveWorkflowRate: 0.7,
    governanceSinglePointRisk: 0.74,
    alternativeCoordinationSuppression: 0.68
  });

  assert.equal(result.monopolyBand, "coordination-monopoly");
  assert.equal(result.requiredAction, "freeze-and-restore-coordination-plurality");
});

test("reversible infrastructure detects non-removable deployment", () => {
  const result = assessReversibleInfrastructure({
    gracefulShutdownPathwayScore: 0.22,
    regionalDecouplingScore: 0.24,
    partialRetirementCapability: 0.2,
    controlledDecommissioningScore: 0.22,
    communityTransitionPlanScore: 0.24,
    fallbackOperationalContinuityScore: 0.2
  });

  assert.equal(result.reversibilityBand, "non-reversible");
  assert.equal(result.requiredAction, "freeze-and-build-removal-pathways");
});

test("civilizational coupling detects platform-coupled society risk", () => {
  const result = analyzeCivilizationalCoupling({
    institutionalIntegrationDepth: 0.78,
    socialAutonomyLossRate: 0.7,
    responderPlatformDependence: 0.74,
    emergencyCultureIrreversibility: 0.72,
    platformCoupledGovernanceAssumptions: 0.76,
    civilizationScaleFailureCoupling: 0.7
  });

  assert.equal(result.couplingBand, "civilization-scale-coupling");
  assert.equal(result.requiredAction, "freeze-and-decouple-civic-systems");
});

test("redundant societal capability detects collapsed manual capacity", () => {
  const result = preserveRedundantSocietalCapability({
    independentEmergencyProcedureScore: 0.24,
    nonDigitalCoordinationNormScore: 0.22,
    communityPreparednessScore: 0.24,
    institutionalDiversityScore: 0.26,
    distributedGovernanceScore: 0.22,
    manualOperationalCompetenceScore: 0.24
  });

  assert.equal(result.redundancyBand, "redundancy-collapsed");
  assert.equal(result.requiredAction, "freeze-and-restore-societal-redundancy");
});

test("power limiting principles detect broken authority constraints", () => {
  const result = enforcePowerLimitingPrinciples({
    constrainedAuthorityScore: 0.24,
    boundedOperationalScopeScore: 0.22,
    removableGovernanceLayerScore: 0.2,
    independentAuditabilityScore: 0.26,
    reversibleDeploymentScore: 0.22,
    distributedLegitimacyScore: 0.24
  });

  assert.equal(result.powerBand, "power-limits-broken");
  assert.equal(result.requiredAction, "freeze-and-restore-power-limiting-constraints");
});

test("post-infrastructure survivability detects unsafe decommissioning", () => {
  const result = modelPostInfrastructureSurvivability({
    safeTransitionAwayScore: 0.22,
    communityResilienceRetentionScore: 0.24,
    institutionIndependentCapabilityScore: 0.2,
    governanceDecommissioningSurvivalScore: 0.22,
    postUseTrustContinuityScore: 0.24
  });

  assert.equal(result.postInfrastructureBand, "post-infrastructure-unsafe");
  assert.equal(result.requiredAction, "freeze-and-build-post-platform-survivability");
});

test("existential safety posture freezes irreversible civic dependency", () => {
  const result = recommendExistentialSafetyPosture({
    irreversibility: { societalDependencyAccumulation: 0.78, institutionalLockInRate: 0.74, coordinationMonocultureFormation: 0.76, operationalIrreversibilityRisk: 0.72, replacementImpossibilityRisk: 0.7, overCentralizedEmergencyReliance: 0.74 },
    selfSufficiency: { localInitiativeScore: 0.24, decentralizedCoordinationScore: 0.22, offlineCommunityCapabilityScore: 0.24, independentInstitutionalCompetence: 0.26, nonPlatformEmergencyPathwayScore: 0.2, manualFallbackGovernanceScore: 0.22 },
    failure: { catastrophicShutdownDestabilizationRisk: 0.76, telecomCollapseImpact: 0.7, governanceCollapseImpact: 0.74, institutionalWithdrawalImpact: 0.72, cloudProviderDisappearanceImpact: 0.7, operatorAbandonmentImpact: 0.68, publicTrustCollapseImpact: 0.76 },
    monopoly: { singleSystemEmergencyDependence: 0.76, coordinationMonopolizationRisk: 0.74, institutionalOverCentralizationRate: 0.72, platformExclusiveWorkflowRate: 0.7, governanceSinglePointRisk: 0.74, alternativeCoordinationSuppression: 0.68 },
    reversibility: { gracefulShutdownPathwayScore: 0.22, regionalDecouplingScore: 0.24, partialRetirementCapability: 0.2, controlledDecommissioningScore: 0.22, communityTransitionPlanScore: 0.24, fallbackOperationalContinuityScore: 0.2 },
    coupling: { institutionalIntegrationDepth: 0.78, socialAutonomyLossRate: 0.7, responderPlatformDependence: 0.74, emergencyCultureIrreversibility: 0.72, platformCoupledGovernanceAssumptions: 0.76, civilizationScaleFailureCoupling: 0.7 },
    redundancy: { independentEmergencyProcedureScore: 0.24, nonDigitalCoordinationNormScore: 0.22, communityPreparednessScore: 0.24, institutionalDiversityScore: 0.26, distributedGovernanceScore: 0.22, manualOperationalCompetenceScore: 0.24 },
    powerLimits: { constrainedAuthorityScore: 0.24, boundedOperationalScopeScore: 0.22, removableGovernanceLayerScore: 0.2, independentAuditabilityScore: 0.26, reversibleDeploymentScore: 0.22, distributedLegitimacyScore: 0.24 },
    postInfrastructure: { safeTransitionAwayScore: 0.22, communityResilienceRetentionScore: 0.24, institutionIndependentCapabilityScore: 0.2, governanceDecommissioningSurvivalScore: 0.22, postUseTrustContinuityScore: 0.24 }
  });

  assert.equal(result.posture, "existential-safety-freeze");
  assert.equal(result.certificationBoundary, "existential-safety-limits-irreversibility-but-does-not-certify-readiness");
});
