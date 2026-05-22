function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

export function evaluateDeploymentGovernance(input = {}) {
  const readiness = clamp(input.readinessScore ?? 0);
  const governance = clamp(input.governanceReadiness ?? 0);
  const trust = clamp(input.trustDurabilityScore ?? 0);
  const institutional = clamp(input.institutionalReliabilityScore ?? 0);
  const audit = clamp(input.auditCompleteness ?? 0);
  const unresolvedCriticalRisks = input.unresolvedCriticalRisks ?? 0;
  const convergencePassed = Boolean(input.convergencePassed);
  const fieldReadinessPassed = Boolean(input.fieldReadinessPassed);
  const reviewBoardApproved = Boolean(input.reviewBoardApproved);

  const activationScore = clamp(
    readiness * 0.22 +
    governance * 0.2 +
    trust * 0.18 +
    institutional * 0.16 +
    audit * 0.14 +
    (convergencePassed ? 0.05 : 0) +
    (fieldReadinessPassed ? 0.05 : 0) -
    unresolvedCriticalRisks * 0.12
  );

  let decision = "do-not-activate";
  if (activationScore >= 0.86 && convergencePassed && fieldReadinessPassed && reviewBoardApproved && unresolvedCriticalRisks === 0) {
    decision = "activate-controlled-pilot";
  } else if (activationScore >= 0.68 && reviewBoardApproved && unresolvedCriticalRisks === 0) {
    decision = "shadow-or-limited-hours-only";
  } else if (activationScore >= 0.5) {
    decision = "governance-remediation-required";
  }

  return {
    activationScore: Number(activationScore.toFixed(3)),
    decision,
    requiredApprovals:
      decision === "activate-controlled-pilot"
        ? ["pilot-review-board", "operations-supervisor", "trust-administrator", "institutional-liaison"]
        : ["pilot-review-board", "operations-supervisor"],
    blockers: [
      ...(!fieldReadinessPassed ? ["field-readiness-not-passed"] : []),
      ...(!convergencePassed ? ["convergence-not-passed"] : []),
      ...(!reviewBoardApproved ? ["review-board-not-approved"] : []),
      ...(unresolvedCriticalRisks > 0 ? ["unresolved-critical-risks"] : [])
    ]
  };
}

export function determineGovernanceAuthority(event = {}) {
  if ((event.lifeSafetyRisk ?? 0) >= 0.9 || event.activeDisasterMode) {
    return {
      authority: "emergency-shutdown-or-disaster-supervisor",
      powers: ["pause-noncritical-dispatch", "activate-disaster-mode", "force-institutional-escalation"]
    };
  }

  if ((event.trustRiskScore ?? 0) >= 0.75 || event.responderMisconductAllegation) {
    return {
      authority: "trust-administrator-and-review-board",
      powers: ["freeze-responder", "restrict-trust-changes", "require-evidence-review"]
    };
  }

  if ((event.operatorOverloadState ?? "normal") !== "normal" || event.degradedModeActive) {
    return {
      authority: "operations-supervisor",
      powers: ["rollback-to-degraded-mode", "partition-operator-queue", "approve-staged-recovery"]
    };
  }

  return {
    authority: "shift-operator",
    powers: ["normal-triage", "document-decision", "request-supervisor-review"]
  };
}

export function evaluateCivicTrustSafeguards(signal = {}) {
  const transparency = clamp(signal.transparencyCoverage ?? 0);
  const accountability = clamp(signal.operatorAccountability ?? 0);
  const appeal = clamp(signal.appealMechanismCoverage ?? 0);
  const misuseReporting = clamp(signal.misuseReportingAvailability ?? 0);
  const auditVisibility = clamp(signal.auditVisibilityScore ?? 0);
  const privacyMinimization = clamp(signal.privacyMinimizationScore ?? 0);
  const antiSurveillance = clamp(signal.antiSurveillanceBoundaryScore ?? 0);

  const safeguardScore = clamp(
    transparency * 0.16 +
    accountability * 0.16 +
    appeal * 0.14 +
    misuseReporting * 0.14 +
    auditVisibility * 0.14 +
    privacyMinimization * 0.14 +
    antiSurveillance * 0.12
  );

  return {
    safeguardScore: Number(safeguardScore.toFixed(3)),
    safeguardBand: safeguardScore >= 0.86 ? "strong" : safeguardScore >= 0.7 ? "adequate" : safeguardScore >= 0.5 ? "weak" : "unsafe",
    requiredAction:
      safeguardScore >= 0.86
        ? "maintain-public-trust-reporting"
        : safeguardScore >= 0.7
          ? "increase-transparency-and-review"
          : safeguardScore >= 0.5
            ? "block-expansion-until-safeguards-improve"
            : "do-not-deploy"
  };
}

export function modelOperationalLiability(caseSignal = {}) {
  const responderMisconduct = clamp(caseSignal.responderMisconductRisk ?? 0) * 0.2;
  const operatorNegligence = clamp(caseSignal.operatorNegligenceRisk ?? 0) * 0.2;
  const delayedCoordination = clamp(caseSignal.delayedCoordinationRisk ?? 0) * 0.16;
  const institutionalNonResponse = clamp(caseSignal.institutionalNonResponseRisk ?? 0) * 0.14;
  const telecomFailure = clamp(caseSignal.telecomFailureRisk ?? 0) * 0.1;
  const escalationDispute = clamp(caseSignal.escalationDisputeRisk ?? 0) * 0.1;
  const evidenceIntegrity = clamp(caseSignal.evidenceIntegrityRisk ?? 0) * 0.1;
  const liabilityScore = clamp(
    responderMisconduct +
    operatorNegligence +
    delayedCoordination +
    institutionalNonResponse +
    telecomFailure +
    escalationDispute +
    evidenceIntegrity
  );

  return {
    liabilityScore: Number(liabilityScore.toFixed(3)),
    liabilityBand: liabilityScore >= 0.75 ? "severe" : liabilityScore >= 0.55 ? "high" : liabilityScore >= 0.32 ? "moderate" : "low",
    requiredControls:
      liabilityScore >= 0.75
        ? ["external-review", "evidence-freeze", "deployment-freeze", "legal-export-package"]
        : liabilityScore >= 0.55
          ? ["supervisor-review", "evidence-freeze", "corrective-action-plan"]
          : liabilityScore >= 0.32
            ? ["incident-review", "operator-note-audit"]
            : ["routine-audit"]
  };
}

export function evaluateSafePilotGovernance(program = {}) {
  const supervision = clamp(program.supervisionCoverage ?? 0);
  const reviewBoard = clamp(program.incidentReviewBoardReadiness ?? 0);
  const responderCertification = clamp(program.responderCertificationCoverage ?? 0);
  const auditSchedule = clamp(program.auditScheduleCompliance ?? 0);
  const escalationCommittee = clamp(program.escalationCommitteeReadiness ?? 0);
  const fieldCoordination = clamp(program.fieldCoordinatorCoverage ?? 0);
  const shutdownProcedure = clamp(program.shutdownProcedureReadiness ?? 0);
  const score = clamp(
    supervision * 0.16 +
    reviewBoard * 0.16 +
    responderCertification * 0.15 +
    auditSchedule * 0.14 +
    escalationCommittee * 0.14 +
    fieldCoordination * 0.13 +
    shutdownProcedure * 0.12
  );

  return {
    pilotGovernanceScore: Number(score.toFixed(3)),
    pilotGovernanceBand: score >= 0.86 ? "governed" : score >= 0.7 ? "limited" : score >= 0.5 ? "immature" : "unsafe",
    operatingMode:
      score >= 0.86
        ? "controlled-operational-pilot"
        : score >= 0.7
          ? "limited-supervised-pilot"
          : score >= 0.5
            ? "dry-runs-only"
            : "do-not-run"
  };
}

export function recommendPreDeploymentDecision(input = {}) {
  const deployment = evaluateDeploymentGovernance(input.deployment);
  const safeguards = evaluateCivicTrustSafeguards(input.safeguards);
  const liability = modelOperationalLiability(input.liability);
  const pilot = evaluateSafePilotGovernance(input.pilot);

  if (liability.liabilityBand === "severe" || safeguards.safeguardBand === "unsafe" || pilot.pilotGovernanceBand === "unsafe") {
    return {
      decision: "emergency-freeze",
      deployment,
      safeguards,
      liability,
      pilot
    };
  }

  if (deployment.decision === "activate-controlled-pilot" && safeguards.safeguardBand === "strong" && pilot.pilotGovernanceBand === "governed" && liability.liabilityBand !== "high") {
    return {
      decision: "approve-controlled-pilot",
      deployment,
      safeguards,
      liability,
      pilot
    };
  }

  if (deployment.decision === "shadow-or-limited-hours-only" || pilot.operatingMode === "limited-supervised-pilot") {
    return {
      decision: "limited-supervised-pilot-only",
      deployment,
      safeguards,
      liability,
      pilot
    };
  }

  return {
    decision: "do-not-deploy-remediate-governance",
    deployment,
    safeguards,
    liability,
    pilot
  };
}
