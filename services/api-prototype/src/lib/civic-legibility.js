function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

const ACTION_LABELS = {
  escalation: "Escalation decision",
  degradedMode: "Degraded-mode decision",
  trustRestriction: "Trust restriction",
  responderPriority: "Responder prioritization",
  shutdown: "Shutdown recommendation",
  uncertaintyFreeze: "Uncertainty freeze",
  rollback: "Rollback decision",
  certificationWithheld: "Certification withheld"
};

export function surfaceUncertainty(signal = {}) {
  const uncertaintyItems = [];

  if ((signal.incompleteInformationRate ?? 0) > 0.2) uncertaintyItems.push("information is incomplete");
  if ((signal.confidenceVolatility ?? 0) > 0.2) uncertaintyItems.push("confidence is unstable");
  if ((signal.contradictoryObservationRate ?? 0) > 0.15) uncertaintyItems.push("observations conflict");
  if ((signal.telecomUncertainty ?? 0) > 0.2) uncertaintyItems.push("telecom delivery is uncertain");
  if ((signal.operationalAmbiguityRate ?? 0) > 0.15) uncertaintyItems.push("operational meaning remains ambiguous");
  if ((signal.degradedStateActive ?? false)) uncertaintyItems.push("system is operating with degraded capability");
  if ((signal.unresolvedIncidentCount ?? 0) > 0) uncertaintyItems.push("some incident evidence is unresolved");

  return {
    uncertaintyItems,
    uncertaintyBand: uncertaintyItems.length >= 5 ? "high" : uncertaintyItems.length >= 3 ? "material" : uncertaintyItems.length >= 1 ? "limited" : "low",
    certaintyLanguageAllowed: uncertaintyItems.length === 0,
    plainLanguage:
      uncertaintyItems.length === 0
        ? "Current evidence is sufficient for limited supervised interpretation, but not permanent certainty."
        : `This decision remains uncertain because ${uncertaintyItems.join(", ")}.`
  };
}

export function buildDecisionExplanation(decision = {}) {
  const uncertainty = surfaceUncertainty(decision.uncertainty);
  const activeConstraints = decision.constraints ?? [];
  const reasons = decision.reasons ?? [];
  const refusedAction = decision.refusedAction ?? null;
  const action = decision.actionType ?? "operationalDecision";

  return {
    title: ACTION_LABELS[action] ?? "Operational decision",
    summary: refusedAction
      ? `The system refused ${refusedAction} because active safety, governance, or uncertainty limits were not satisfied.`
      : `The system recommended ${decision.recommendedAction ?? "a restricted action"} under current constraints.`,
    reasons,
    activeConstraints,
    uncertainty,
    limitationStatement: "This explanation describes current evidence and limits. It is not proof of full operational readiness.",
    operatorMessage: [
      reasons.length ? `Main reasons: ${reasons.join("; ")}.` : "No single reason is sufficient alone; this is a constraint-based decision.",
      activeConstraints.length ? `Active constraints: ${activeConstraints.join("; ")}.` : "No additional constraints were supplied.",
      uncertainty.plainLanguage
    ].join(" "),
    confidenceDisplay: uncertainty.certaintyLanguageAllowed ? "conditional-confidence" : "uncertain-do-not-present-as-certain"
  };
}

export function explainGovernanceAction(action = {}) {
  const reasons = action.reasons ?? [];
  const restrictions = action.restrictions ?? [];
  const withheld = action.certificationWithheld === true;

  return {
    governanceAction: action.name ?? "governance-review",
    recommendation: action.recommendation ?? "maintain-supervised-review",
    plainLanguage: withheld
      ? "Certification or expansion was withheld because required evidence, safety gates, or governance controls remain incomplete."
      : "The governance recommendation is conditional and remains subject to review.",
    reasons,
    restrictions,
    appealOrReviewPath: action.reviewPath ?? "supervisor-review-board",
    auditRequired: action.auditRequired !== false,
    expansionAllowed: action.expansionAllowed === true && !withheld && restrictions.length === 0
  };
}

export function buildCommunityTrustNotice(policy = {}) {
  const collected = policy.dataCollected ?? ["incident category", "approximate location", "time", "status updates"];
  const notCollected = policy.dataNotCollected ?? ["facial recognition", "continuous tracking", "private messages", "biometric identity"];
  const safeguards = policy.safeguards ?? ["human supervision", "audit trail", "privacy expiration", "restricted automation"];

  return {
    audience: "resident-community",
    plainLanguage: "The platform coordinates low-risk civic help. It is not a surveillance system and does not replace emergency authorities.",
    dataCollected: collected,
    dataNotCollected: notCollected,
    safeguards,
    shutdownAuthorityExplanation: "Shutdown authority exists so supervisors can stop operation when safety, trust, telecom, or governance conditions become unsafe.",
    automationBoundary: "Automation may recommend restrictions or reviews, but human governance remains dominant.",
    privacyBoundary: "Data collection should remain minimal, purpose-bound, auditable, and time-limited."
  };
}

export function compareConflictingReality(input = {}) {
  const sources = input.sources ?? {};
  const entries = Object.entries(sources).filter(([, value]) => typeof value === "number").map(([name, value]) => ({ name, confidence: clamp(value) }));
  const max = entries.length ? Math.max(...entries.map((entry) => entry.confidence)) : 0;
  const min = entries.length ? Math.min(...entries.map((entry) => entry.confidence)) : 0;
  const spread = max - min;
  const unresolved = spread > 0.35 || entries.length < 3 || (input.telecomInconsistent ?? false) || (input.replayConflictActive ?? false);

  return {
    sources: entries,
    conflictScore: Number(spread.toFixed(3)),
    realityState: unresolved ? "unresolved-or-conflicting" : "partially-aligned",
    explanation: unresolved
      ? "Operational truth is not fully resolved. Reports, telemetry, telecom, or replay evidence do not yet agree enough for certainty."
      : "Available sources are partially aligned, but interpretation remains conditional.",
    requiredAction: unresolved ? "show-conflict-and-require-human-review" : "show-conditional-alignment"
  };
}

export function buildAccountabilityTrace(trace = {}) {
  const missing = [];
  if (!trace.approvedBy) missing.push("approver");
  if (!trace.reason) missing.push("reason");
  if (!trace.uncertaintySnapshot) missing.push("uncertainty-snapshot");
  if (!trace.constraints?.length) missing.push("active-constraints");
  if (!trace.assumptions?.length) missing.push("decision-assumptions");
  if (!trace.timestamp) missing.push("timestamp");

  return {
    traceId: trace.traceId ?? "unassigned-trace",
    approvedBy: trace.approvedBy ?? null,
    reason: trace.reason ?? null,
    uncertaintySnapshot: trace.uncertaintySnapshot ?? null,
    constraints: trace.constraints ?? [],
    assumptions: trace.assumptions ?? [],
    timestamp: trace.timestamp ?? null,
    missing,
    traceBand: missing.length === 0 ? "accountable" : missing.length <= 2 ? "incomplete" : "not-accountable",
    requiredAction:
      missing.length === 0
        ? "retain-trace"
        : missing.length <= 2
          ? "complete-trace-before-closure"
          : "do-not-finalize-action"
  };
}

export function assessCivicLegibility(input = {}) {
  const decisionExplanation = buildDecisionExplanation(input.decision);
  const governance = explainGovernanceAction(input.governance);
  const community = buildCommunityTrustNotice(input.communityPolicy);
  const conflictingReality = compareConflictingReality(input.conflictingReality);
  const trace = buildAccountabilityTrace(input.trace);
  const risks = [];

  if (decisionExplanation.confidenceDisplay === "uncertain-do-not-present-as-certain" && input.dashboardShowsPreciseConfidence === true) risks.push("false-precision-display");
  if (governance.expansionAllowed && input.readinessGatesFailed === true) risks.push("governance-expansion-despite-failed-gates");
  if (!community.dataNotCollected.includes("facial recognition")) risks.push("anti-surveillance-boundary-unclear");
  if (conflictingReality.realityState === "unresolved-or-conflicting" && input.autoActionAllowed === true) risks.push("automation-allowed-under-conflicting-reality");
  if (trace.traceBand !== "accountable") risks.push("accountability-trace-incomplete");

  return {
    legibilityBand: risks.length >= 3 ? "unsafe-opaque" : risks.length >= 1 ? "needs-clarification" : "legible",
    risks,
    decisionExplanation,
    governance,
    community,
    conflictingReality,
    trace,
    requiredAction:
      risks.length >= 3
        ? "pause-action-and-restore-legibility"
        : risks.length >= 1
          ? "clarify-before-action"
          : "continue-with-legible-supervision",
    certificationBoundary: "legibility-explains-decisions-but-does-not-certify-readiness"
  };
}
