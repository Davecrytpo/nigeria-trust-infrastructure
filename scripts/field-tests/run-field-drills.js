import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const scenarioPath = process.argv[2] || 'data/field-tests/yaba-survivability-scenarios.json';
const absoluteScenarioPath = path.resolve(process.cwd(), scenarioPath);
const drillPlan = JSON.parse(fs.readFileSync(absoluteScenarioPath, 'utf8'));

function estimateAcknowledgmentLatencyMs(scenario) {
  const { conditions, incidentCount, responderCount, operatorCount } = scenario;
  const controls = conditions.operationalControls ?? {};
  const responderCoverage = Math.max(responderCount / Math.max(incidentCount, 1), 1);
  const operatorLoad = incidentCount / Math.max(operatorCount, 1);
  const networkPenalty = conditions.networkDropRate * 120000 * (controls.edgeRetryRouting ? 0.55 : 1);
  const smsPenalty = Math.min(conditions.smsDelayMs * 0.45 * (controls.smsProviderFailover ? 0.45 : 1), 120000);
  const devicePenalty = conditions.backgroundTerminationRate * 60000 * (controls.backgroundSosRecovery ? 0.35 : 1);
  const gpsPenalty = (conditions.gpsDriftMeters > 150 ? 30000 : 10000) * (controls.gpsDriftCompensation ? 0.45 : 1);
  const staffingCredit = Math.min(responderCoverage * 3500, 45000);
  const operatorPenalty = (operatorLoad > 6 ? 45000 : operatorLoad > 3 ? 20000 : 5000) * (controls.operatorSurgeRouting ? 0.45 : 1);
  const priorityCredit = controls.adaptivePriorityQueue ? Math.min(incidentCount * 2200, 45000) : 0;

  return Math.round(25000 + networkPenalty + smsPenalty + devicePenalty + gpsPenalty + operatorPenalty - staffingCredit - priorityCredit);
}

function estimateOfflineRecoveryRate(scenario) {
  const { conditions } = scenario;
  const controls = conditions.operationalControls ?? {};
  if (!conditions.queueDurability) return 0.6;

  const degradation =
    conditions.networkDropRate * 0.18 * (controls.encryptedWalQueue ? 0.18 : 1) +
    conditions.backgroundTerminationRate * 0.12 * (controls.appKillRecovery ? 0.25 : 1) +
    (conditions.batteryLevelPercent < 10 ? 0.08 * (controls.lowBatterySosMode ? 0.25 : 1) : 0) +
    (conditions.smsDelayMs > 180000 ? 0.04 * (controls.syncCheckpointing ? 0.35 : 1) : 0);
  const recoveryCredit =
    (controls.idempotentOfflineReplay ? 0.018 : 0) +
    (controls.syncCheckpointing ? 0.012 : 0) +
    (controls.queueCorruptionQuarantine ? 0.01 : 0);

  return Number(Math.min(1, Math.max(0, 1 - degradation + recoveryCredit)).toFixed(3));
}

function estimateDuplicateIncidentRate(scenario) {
  const { conditions, incidentCount } = scenario;
  const controls = conditions.operationalControls ?? {};
  const pressure = incidentCount > 10 ? 0.012 : 0.004;
  const networkReplayRisk = conditions.networkDropRate * 0.025;
  const smsReplayRisk = conditions.smsDelayMs > 180000 ? 0.01 : 0.002;
  const reconnectStormRisk = (conditions.reconnectStormMultiplier ?? 1) > 3 ? 0.015 : 0;
  const duplicateSmsRisk = (conditions.duplicateSmsRate ?? 0) * 0.08;
  const suppressionFactor = controls.duplicateSuppression ? 0.35 : 1;

  return Number(((pressure + networkReplayRisk + smsReplayRisk + reconnectStormRisk + duplicateSmsRisk) * suppressionFactor).toFixed(3));
}

function estimateReplayConsistencyRate(scenario) {
  const { conditions } = scenario;
  const controls = conditions.operationalControls ?? {};
  if (!conditions.queueDurability) return 0.72;

  const corruptionPenalty = (conditions.sqliteCorruptionRate ?? 0) * 0.7 * (controls.queueCorruptionQuarantine ? 0.15 : 1);
  const reconnectPenalty = Math.max(0, (conditions.reconnectStormMultiplier ?? 1) - 1) * 0.018 * (controls.idempotentOfflineReplay ? 0.2 : 1);
  const dnsPenalty = (conditions.dnsInstabilityRate ?? 0) * 0.05 * (controls.edgeRetryRouting ? 0.4 : 1);
  const processPenalty = conditions.backgroundTerminationRate * 0.06 * (controls.appKillRecovery ? 0.3 : 1);
  const deterministicReplayCredit = controls.deterministicReplayOrdering ? 0.02 : 0;

  return Number(Math.min(1, Math.max(0, 1 - corruptionPenalty - reconnectPenalty - dnsPenalty - processPenalty + deterministicReplayCredit)).toFixed(3));
}

function estimateOperatorDecisionLatencyMs(scenario) {
  const { incidentCount, operatorCount, conditions } = scenario;
  const controls = conditions.operationalControls ?? {};
  const operatorLoad = incidentCount / Math.max(operatorCount, 1);
  const fatiguePenalty = (conditions.operatorFatigueHours ?? 0) * 4500 * (controls.shiftHandoffProtection ? 0.45 : 1);
  const confusionPenalty = (conditions.confusedUserRate ?? 0) * 45000 * (controls.incidentTriageUx ? 0.45 : 1);
  const institutionalPenalty = (conditions.institutionalFailureRate ?? 0) * 60000 * (controls.supervisorEscalationRails ? 0.5 : 1);
  const maliciousPenalty = (conditions.maliciousFalseReportRate ?? 0) * 30000 * (controls.spamQuarantine ? 0.35 : 1);
  const overloadCredit = controls.operatorQueuePartitioning ? Math.min(incidentCount * 3500, 70000) : 0;

  return Math.round(20000 + operatorLoad * 8000 + fatiguePenalty + confusionPenalty + institutionalPenalty + maliciousPenalty - overloadCredit);
}

function estimateResponderReliabilityRate(scenario) {
  const { conditions, responderCount, incidentCount } = scenario;
  const controls = conditions.operationalControls ?? {};
  const scarcityPenalty = Math.max(0, incidentCount - responderCount) * 0.015 * (controls.responderLoadBalancing ? 0.15 : 1);
  const nonCompliancePenalty = (conditions.responderNonComplianceRate ?? 0) * 0.55 * (controls.responderAckEscalation ? 0.2 : 1);
  const fatiguePenalty = ((conditions.operatorFatigueHours ?? 0) > 12 ? 0.04 : 0) * (controls.shiftHandoffProtection ? 0.4 : 1);
  const scarcityCredit = controls.scarcityDispatchMode ? 0.08 : 0;

  return Number(Math.min(0.99, Math.max(0, 0.98 - scarcityPenalty - nonCompliancePenalty - fatiguePenalty + scarcityCredit)).toFixed(3));
}

function estimateTrustIntegrityRate(scenario) {
  const { conditions } = scenario;
  const controls = conditions.operationalControls ?? {};
  const fakeVerificationPenalty = (conditions.fakeVerificationAttemptRate ?? 0) * 0.5 * (controls.deviceAttestation ? 0.08 : 1);
  const spamPenalty = (conditions.coordinatedSpamRate ?? 0) * 0.35 * (controls.spamQuarantine ? 0.06 : 1);
  const manipulationPenalty = (conditions.trustScoreManipulationRate ?? 0) * 0.6 * (controls.trustMutationAudit ? 0.08 : 1);
  const coercionPenalty = (conditions.coercionRiskRate ?? 0) * 0.35 * (controls.duressReviewGate ? 0.15 : 1);

  return Number(Math.max(0, 1 - fakeVerificationPenalty - spamPenalty - manipulationPenalty - coercionPenalty).toFixed(3));
}

function estimateTelecomReceiptIntegrityRate(scenario) {
  const { conditions } = scenario;
  const controls = conditions.operationalControls ?? {};
  const receiptPenalty = (conditions.droppedDeliveryReceiptRate ?? 0) * 0.45 * (controls.receiptReconciliation ? 0.08 : 1);
  const duplicatePenalty = (conditions.duplicateSmsRate ?? 0) * 0.2 * (controls.duplicateSuppression ? 0.1 : 1);
  const fallbackPenalty = (conditions.twoGFallbackRate ?? 0) * 0.12 * (controls.ussdFallback ? 0.3 : 1);
  const congestionPenalty = (conditions.mtnCongestionRate ?? 0) * 0.16 * (controls.smsProviderFailover ? 0.18 : 1);
  const auditCredit = controls.crossProviderReceiptAudit ? 0.06 : 0;

  return Number(Math.min(1, Math.max(0, 1 - receiptPenalty - duplicatePenalty - fallbackPenalty - congestionPenalty + auditCredit)).toFixed(3));
}

function estimateDisasterCoordinationRate(scenario) {
  const { conditions, incidentCount, responderCount, operatorCount } = scenario;
  const controls = conditions.operationalControls ?? {};
  const surgePenalty = Math.max(0, incidentCount - responderCount * 0.75) * 0.012 * (controls.regionalIncidentClustering ? 0.15 : 1);
  const operatorPenalty = Math.max(0, incidentCount / Math.max(operatorCount, 1) - 6) * 0.018 * (controls.operatorQueuePartitioning ? 0.2 : 1);
  const blackoutPenalty = (conditions.blackoutAreaRate ?? 0) * 0.25 * (controls.offlineCommunityFallback ? 0.25 : 1);
  const institutionalPenalty = (conditions.institutionalFailureRate ?? 0) * 0.35 * (controls.degradedInstitutionalRouting ? 0.25 : 1);
  const scarcityCredit = controls.scarcityDispatchMode ? 0.12 : 0;

  return Number(Math.min(1, Math.max(0, 1 - surgePenalty - operatorPenalty - blackoutPenalty - institutionalPenalty + scarcityCredit)).toFixed(3));
}

function runScenario(scenario, acceptanceMetrics) {
  const acknowledgmentLatencyMs = estimateAcknowledgmentLatencyMs(scenario);
  const offlineRecoveryRate = estimateOfflineRecoveryRate(scenario);
  const duplicateIncidentRate = estimateDuplicateIncidentRate(scenario);
  const criticalEventRetentionRate = scenario.conditions.queueDurability ? 1 : 0.7;
  const operatorAmbiguityCount = scenario.expected.operatorEscalation && scenario.operatorCount < 1 ? 1 : 0;
  const replayConsistencyRate = estimateReplayConsistencyRate(scenario);
  const operatorDecisionLatencyMs = estimateOperatorDecisionLatencyMs(scenario);
  const responderReliabilityRate = estimateResponderReliabilityRate(scenario);
  const trustIntegrityRate = estimateTrustIntegrityRate(scenario);
  const telecomReceiptIntegrityRate = estimateTelecomReceiptIntegrityRate(scenario);
  const disasterCoordinationRate = estimateDisasterCoordinationRate(scenario);

  const checks = [
    {
      name: 'acknowledgment latency',
      pass: acknowledgmentLatencyMs <= acceptanceMetrics.maxAcknowledgmentLatencyMs,
      value: `${acknowledgmentLatencyMs}ms`,
      target: `<=${acceptanceMetrics.maxAcknowledgmentLatencyMs}ms`
    },
    {
      name: 'offline recovery',
      pass: offlineRecoveryRate >= acceptanceMetrics.minOfflineRecoveryRate,
      value: offlineRecoveryRate,
      target: `>=${acceptanceMetrics.minOfflineRecoveryRate}`
    },
    {
      name: 'duplicate incident control',
      pass: duplicateIncidentRate <= acceptanceMetrics.maxDuplicateIncidentRate,
      value: duplicateIncidentRate,
      target: `<=${acceptanceMetrics.maxDuplicateIncidentRate}`
    },
    {
      name: 'critical event retention',
      pass: criticalEventRetentionRate >= acceptanceMetrics.minCriticalEventRetentionRate,
      value: criticalEventRetentionRate,
      target: acceptanceMetrics.minCriticalEventRetentionRate
    },
    {
      name: 'operator clarity',
      pass: operatorAmbiguityCount <= acceptanceMetrics.maxOperatorAmbiguityCount,
      value: operatorAmbiguityCount,
      target: acceptanceMetrics.maxOperatorAmbiguityCount
    }
  ];

  if (acceptanceMetrics.minReplayConsistencyRate !== undefined) {
    checks.push({
      name: 'replay consistency',
      pass: replayConsistencyRate >= acceptanceMetrics.minReplayConsistencyRate,
      value: replayConsistencyRate,
      target: `>=${acceptanceMetrics.minReplayConsistencyRate}`
    });
  }

  if (acceptanceMetrics.maxOperatorDecisionLatencyMs !== undefined) {
    checks.push({
      name: 'operator decision latency',
      pass: operatorDecisionLatencyMs <= acceptanceMetrics.maxOperatorDecisionLatencyMs,
      value: `${operatorDecisionLatencyMs}ms`,
      target: `<=${acceptanceMetrics.maxOperatorDecisionLatencyMs}ms`
    });
  }

  if (acceptanceMetrics.minResponderReliabilityRate !== undefined) {
    checks.push({
      name: 'responder reliability',
      pass: responderReliabilityRate >= acceptanceMetrics.minResponderReliabilityRate,
      value: responderReliabilityRate,
      target: `>=${acceptanceMetrics.minResponderReliabilityRate}`
    });
  }

  if (acceptanceMetrics.minTrustIntegrityRate !== undefined) {
    checks.push({
      name: 'trust integrity',
      pass: trustIntegrityRate >= acceptanceMetrics.minTrustIntegrityRate,
      value: trustIntegrityRate,
      target: `>=${acceptanceMetrics.minTrustIntegrityRate}`
    });
  }

  if (acceptanceMetrics.minTelecomReceiptIntegrityRate !== undefined) {
    checks.push({
      name: 'telecom receipt integrity',
      pass: telecomReceiptIntegrityRate >= acceptanceMetrics.minTelecomReceiptIntegrityRate,
      value: telecomReceiptIntegrityRate,
      target: `>=${acceptanceMetrics.minTelecomReceiptIntegrityRate}`
    });
  }

  if (acceptanceMetrics.minDisasterCoordinationRate !== undefined) {
    checks.push({
      name: 'disaster coordination',
      pass: disasterCoordinationRate >= acceptanceMetrics.minDisasterCoordinationRate,
      value: disasterCoordinationRate,
      target: `>=${acceptanceMetrics.minDisasterCoordinationRate}`
    });
  }

  return {
    id: scenario.id,
    name: scenario.name,
    category: scenario.category,
    pass: checks.every((check) => check.pass),
    checks
  };
}

const results = drillPlan.scenarios.map((scenario) => runScenario(scenario, drillPlan.acceptanceMetrics));

console.log(`Field survivability drills: ${drillPlan.pilotZone} (${drillPlan.version})`);
for (const result of results) {
  console.log(`${result.pass ? 'PASS' : 'FAIL'} ${result.id} - ${result.name}`);
  for (const check of result.checks) {
    console.log(`  ${check.pass ? 'PASS' : 'FAIL'} ${check.name}: ${check.value} target ${check.target}`);
  }
}

const failed = results.filter((result) => !result.pass);
if (failed.length > 0) {
  console.error(`${failed.length} field drill(s) failed survivability thresholds.`);
  process.exit(1);
}
