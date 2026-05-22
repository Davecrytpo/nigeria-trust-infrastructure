# Governance And Audit

Status: Operational baseline for trust integrity.

## Governance Model

- Platform operator: handles live coordination and records operational decisions.
- Shift supervisor: approves escalations, closures under uncertainty, and responder freezes.
- Trust administrator: approves responder verification, suspension, reinstatement, and territory changes.
- Institutional node lead: represents clinic, police, school, estate, or partner organization.
- Audit reviewer: reviews incident integrity, evidence access, and policy compliance after the fact.

## Audit Requirements

- Record incident creation, stage transitions, responder notifications, acknowledgments, operator overrides, escalations, and closure reasons.
- Preserve canonical event ordering with server timestamps and original client timestamps.
- Separate operational notes from legal evidence exports.
- Log every evidence access, export, redaction, and permission change.
- Require supervisor approval for evidence deletion, retention override, or sensitive export.

## Evidence Retention Baseline

- Routine false alarm: retain minimum operational metadata and closure reason.
- Resolved low-risk incident: retain incident timeline, responder actions, and operator notes.
- Serious injury, violence, criminal allegation, responder misconduct, or institutional handoff: retain complete audit package under restricted access.
- Privacy deletion requests must be reviewed against safety, legal, and audit retention duties before action.

## Integrity Controls

- No silent edits to incident timelines.
- Corrections must append a new event with actor, reason, and timestamp.
- Legal evidence exports must include event hash, export actor, export reason, and recipient.
- Urban intelligence analytics must aggregate infrastructure risk and reliability only, not identity surveillance.
