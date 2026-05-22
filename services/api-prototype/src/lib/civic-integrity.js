function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

export function detectPowerConcentration(signal = {}) {
  const authorityAccumulation = clamp(signal.authorityAccumulationRate ?? 0);
  const hiddenOverrideExpansion = clamp(signal.hiddenOverrideExpansionRate ?? 0);
  const supervisorOverreach = clamp(signal.supervisorOverreachRate ?? 0);
  const governanceBypassAttempts = clamp(signal.governanceBypassAttemptRate ?? 0);
  const centralizedDependency = clamp(signal.centralizedApprovalDependency ?? 0);
  const institutionalControl = clamp(signal.institutionalControlConcentration ?? 0);
  const score = clamp(
    authorityAccumulation * 0.18 +
    hiddenOverrideExpansion * 0.18 +
    supervisorOverreach * 0.16 +
    governanceBypassAttempts * 0.18 +
    centralizedDependency * 0.14 +
    institutionalControl * 0.16
  );

  return {
    powerConcentrationScore: Number(score.toFixed(3)),
    powerBand: score >= 0.7 ? "critical-centralization" : score >= 0.45 ? "high-concentration" : score >= 0.22 ? "watch" : "distributed",
    requiredAction:
      score >= 0.7
        ? "freeze-authority-expansion"
        : score >= 0.45
          ? "require-multiparty-review"
          : score >= 0.22
            ? "increase-override-visibility"
            : "continue-distributed-oversight"
  };
}

export function detectSurveillanceDrift(signal = {}) {
  const unauthorizedRetention = clamp(signal.unauthorizedRetentionRate ?? 0);
  const scopeCreep = clamp(signal.operationalScopeCreepRate ?? 0);
  const telemetryExpansion = clamp(signal.excessTelemetryExpansionRate ?? 0);
  const hiddenTracking = clamp(signal.hiddenTrackingIncentiveRate ?? 0);
  const locationRetention = clamp(signal.nonExpiringLocationStorageRate ?? 0);
  const identityOverCollection = clamp(signal.identityOverCollectionRate ?? 0);
  const profilingPressure = clamp(signal.crossIncidentProfilingPressure ?? 0);
  const score = clamp(
    unauthorizedRetention * 0.16 +
    scopeCreep * 0.15 +
    telemetryExpansion * 0.15 +
    hiddenTracking * 0.16 +
    locationRetention * 0.15 +
    identityOverCollection * 0.12 +
    profilingPressure * 0.11
  );

  return {
    surveillanceDriftScore: Number(score.toFixed(3)),
    driftBand: score >= 0.65 ? "surveillance-risk" : score >= 0.4 ? "scope-drift" : score >= 0.2 ? "watch" : "contained",
    requiredAction:
      score >= 0.65
        ? "freeze-data-expansion-and-delete-unauthorized-data"
        : score >= 0.4
          ? "privacy-review-and-scope-reduction"
          : score >= 0.2
            ? "increase-data-minimization-audit"
            : "maintain-minimal-data-posture"
  };
}

export function resistGovernanceBypass(signal = {}) {
  const undocumentedOverride = clamp(signal.undocumentedOverrideRate ?? 0);
  const emergencyPowerAbuse = clamp(signal.emergencyPowerAbuseRate ?? 0);
  const operatorShortcut = clamp(signal.operatorShortcutEscalationRate ?? 0);
  const hiddenAdminAuthority = clamp(signal.hiddenAdminAuthorityRate ?? 0);
  const silentPolicyModification = clamp(signal.silentPolicyModificationRate ?? 0);
  const unreviewedSupervisorIntervention = clamp(signal.unreviewedSupervisorInterventionRate ?? 0);
  const score = clamp(
    undocumentedOverride * 0.18 +
    emergencyPowerAbuse * 0.18 +
    operatorShortcut * 0.14 +
    hiddenAdminAuthority * 0.18 +
    silentPolicyModification * 0.16 +
    unreviewedSupervisorIntervention * 0.16
  );

  return {
    bypassRiskScore: Number(score.toFixed(3)),
    bypassBand: score >= 0.65 ? "active-bypass" : score >= 0.4 ? "bypass-pressure" : score >= 0.2 ? "watch" : "controlled",
    requiredAction:
      score >= 0.65
        ? "invalidate-unreviewed-authority-and-freeze"
        : score >= 0.4
          ? "require-override-audit-and-board-review"
          : score >= 0.2
            ? "increase-exception-reporting"
            : "continue-reviewed-authority"
  };
}

export function modelPoliticalPressure(signal = {}) {
  const escalationPressure = clamp(signal.politicalEscalationPressure ?? 0);
  const selectivePrioritization = clamp(signal.selectivePrioritizationAttemptRate ?? 0);
  const favoritism = clamp(signal.institutionalFavoritismRate ?? 0);
  const suppression = clamp(signal.suppressionIncentiveRate ?? 0);
  const reputationManipulation = clamp(signal.reputationManipulationRequestRate ?? 0);
  const narrativeControl = clamp(signal.narrativeControlPressure ?? 0);
  const score = clamp(
    escalationPressure * 0.17 +
    selectivePrioritization * 0.18 +
    favoritism * 0.16 +
    suppression * 0.18 +
    reputationManipulation * 0.15 +
    narrativeControl * 0.16
  );

  return {
    politicalPressureScore: Number(score.toFixed(3)),
    pressureBand: score >= 0.65 ? "coercive-pressure" : score >= 0.4 ? "high-pressure" : score >= 0.2 ? "watch" : "low",
    requiredAction:
      score >= 0.65
        ? "activate-independent-review-and-freeze-discretionary-actions"
        : score >= 0.4
          ? "require-public-interest-review"
          : score >= 0.2
            ? "log-pressure-and-require-second-approval"
            : "continue-pressure-monitoring"
  };
}

export function enforceRightsPreservation(signal = {}) {
  const failures = [];

  if ((signal.dataMinimizationScore ?? 1) < 0.8) failures.push("minimum-necessary-data-not-proven");
  if ((signal.authorityReversibilityScore ?? 1) < 0.8) failures.push("authority-not-clearly-reversible");
  if ((signal.auditabilityScore ?? 1) < 0.85) failures.push("governance-not-fully-auditable");
  if ((signal.interventionExplainabilityScore ?? 1) < 0.8) failures.push("interventions-not-explainable");
  if ((signal.automationConstraintScore ?? 1) < 0.85) failures.push("automation-authority-not-constrained");
  if ((signal.independentReviewabilityScore ?? 1) < 0.8) failures.push("independent-reviewability-weak");
  if ((signal.residentPrivacyBoundaryScore ?? 1) < 0.85) failures.push("resident-privacy-boundary-weak");
  if ((signal.responderConsentBoundaryScore ?? 1) < 0.8) failures.push("responder-consent-boundary-weak");
  if ((signal.telemetryExpirationScore ?? 1) < 0.85) failures.push("sensitive-telemetry-expiration-weak");
  if ((signal.identityLinkageConstraintScore ?? 1) < 0.85) failures.push("identity-linkage-too-broad");

  return {
    failures,
    rightsBand: failures.length >= 5 ? "rights-unsafe" : failures.length >= 2 ? "rights-at-risk" : failures.length === 1 ? "watch" : "preserved",
    requiredAction:
      failures.length >= 5
        ? "stop-operation-until-rights-controls-restored"
        : failures.length >= 2
          ? "restrict-operation-and-remediate-rights"
          : failures.length === 1
            ? "repair-rights-control-before-expansion"
            : "continue-rights-preserving-operation"
  };
}

export function assessOversightArchitecture(signal = {}) {
  const gaps = [];

  if (!signal.multiPartyReviewRequired) gaps.push("multi-party-review-not-required");
  if (!signal.distributedGovernanceVisibility) gaps.push("distributed-governance-visibility-missing");
  if (!signal.supervisorAccountabilityChain) gaps.push("supervisor-accountability-chain-missing");
  if (!signal.independentAuditPathway) gaps.push("independent-audit-pathway-missing");
  if (!signal.conflictOfInterestDisclosure) gaps.push("conflict-of-interest-disclosure-missing");
  if (!signal.overrideTransparency) gaps.push("override-transparency-missing");

  return {
    gaps,
    oversightBand: gaps.length >= 4 ? "unsafe-oversight" : gaps.length >= 2 ? "weak-oversight" : gaps.length === 1 ? "watch" : "distributed-accountable",
    requiredAction:
      gaps.length >= 4
        ? "do-not-allow-exceptional-authority"
        : gaps.length >= 2
          ? "require-oversight-remediation"
          : gaps.length === 1
            ? "complete-oversight-gap"
            : "continue-multiparty-oversight"
  };
}

export function recommendCivicIntegrityPosture(input = {}) {
  const power = detectPowerConcentration(input.power);
  const surveillance = detectSurveillanceDrift(input.surveillance);
  const bypass = resistGovernanceBypass(input.bypass);
  const political = modelPoliticalPressure(input.political);
  const rights = enforceRightsPreservation(input.rights);
  const oversight = assessOversightArchitecture(input.oversight);
  const hardStop =
    power.requiredAction === "freeze-authority-expansion" ||
    surveillance.requiredAction === "freeze-data-expansion-and-delete-unauthorized-data" ||
    bypass.requiredAction === "invalidate-unreviewed-authority-and-freeze" ||
    political.requiredAction === "activate-independent-review-and-freeze-discretionary-actions" ||
    rights.requiredAction === "stop-operation-until-rights-controls-restored" ||
    oversight.requiredAction === "do-not-allow-exceptional-authority";
  const riskScore = clamp(
    power.powerConcentrationScore * 0.18 +
    surveillance.surveillanceDriftScore * 0.2 +
    bypass.bypassRiskScore * 0.18 +
    political.politicalPressureScore * 0.16 +
    (rights.rightsBand === "rights-unsafe" ? 0.16 : rights.rightsBand === "rights-at-risk" ? 0.1 : rights.rightsBand === "watch" ? 0.05 : 0) +
    (oversight.oversightBand === "unsafe-oversight" ? 0.12 : oversight.oversightBand === "weak-oversight" ? 0.08 : oversight.oversightBand === "watch" ? 0.04 : 0)
  );

  return {
    posture: hardStop
      ? "civic-integrity-freeze"
      : riskScore >= 0.4 || political.pressureBand === "high-pressure" || rights.rightsBand === "rights-at-risk"
        ? "restrict-authority-and-require-independent-review"
      : riskScore >= 0.22
          ? "heightened-civic-integrity-watch"
          : "continue-rights-preserving-supervision",
    riskScore: Number(riskScore.toFixed(3)),
    power,
    surveillance,
    bypass,
    political,
    rights,
    oversight,
    certificationBoundary: "civic-integrity-restricts-power-but-does-not-certify-readiness"
  };
}
