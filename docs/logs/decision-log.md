# Decision Log

## D-037 - Civic infrastructure must strengthen society, not replace it

- Date: 2026-05-21
- Status: Accepted
- Decision: Add civilizational stability controls to evaluate whether the platform stabilizes or destabilizes society over long horizons.
- Reason: major civic infrastructure can reshape public psychology, institutional behavior, local resilience, and legitimacy across generations.

## D-036 - Evolution must preserve legitimacy and founding principles

- Date: 2026-05-21
- Status: Accepted
- Decision: Add adaptive legitimacy controls to detect mission drift, technology overreach, complexity growth, principle failure, societal misalignment, weak evolutionary oversight, and permanent emergency normalization.
- Reason: civic infrastructure can survive operationally while gradually becoming socially illegitimate or institutionally coercive.

## D-035 - Sustainability supports survivability but does not certify readiness

- Date: 2026-05-21
- Status: Accepted
- Decision: Model long-horizon sustainability across maintenance, economics, fatigue, trust, dependencies, governance renewal, complexity, cultural adaptation, and repeated recovery burden.
- Reason: civic infrastructure commonly fails from slow social, institutional, economic, and organizational decay rather than immediate technical failure.

## D-034 - Civic integrity restricts power but does not certify readiness

- Date: 2026-05-21
- Status: Accepted
- Decision: Add explicit controls against power concentration, surveillance drift, governance bypass, political pressure, rights erosion, and weak oversight.
- Reason: civic infrastructure must structurally resist institutional overreach and coercive drift, not merely discourage it.

## D-033 - Legibility explains decisions but does not certify readiness

- Date: 2026-05-21
- Status: Accepted
- Decision: Require human-readable explanations, uncertainty disclosure, anti-surveillance boundaries, and accountability traces for major operational actions.
- Reason: civic infrastructure becomes dangerous if operators, institutions, or residents cannot understand why restrictions, shutdowns, rollbacks, or refusals occur.

## D-032 - Prolonged operation is not proof of safety

- Date: 2026-05-21
- Status: Accepted
- Decision: Treat long-duration field operation as evidence for slow-failure discovery, not readiness certification.
- Reason: civic infrastructure can decay gradually through fatigue, normalized degradation, governance shortcuts, trust erosion, and institutional drift.

## D-031 - Live operationalization is learning, not readiness certification

- Date: 2026-05-21
- Status: Accepted
- Decision: Permit only tightly constrained low-risk live learning while preserving failed readiness, stress, and convergence gates as blockers for readiness claims.
- Reason: Live field exposure is useful for acquiring operational truth, but unsafe if treated as deployment proof.

## D-030 - Historical confidence must remain reversible and non-certifying

- Date: 2026-05-21
- Status: Accepted
- Decision: Treat epistemic resilience as a control that challenges certainty, ages memory, penalizes contradictions, and compares perspectives, but never certifies readiness.
- Reason: Repeated observations can create dangerous confidence if they are stale, contradictory, or normalized without independent validation.

## D-029 - Operational memory increases caution but does not certify readiness

- Date: 2026-05-21
- Status: Accepted
- Decision: Use longitudinal operational memory to detect chronic instability, model drift, and false normalization, but never to override failed readiness, stress, or convergence gates.
- Reason: Historical evidence improves humility and governance quality, but readiness still requires survivability and convergence validation.

## D-001 - Create a dedicated project workspace

- Date: 2026-05-20
- Status: Accepted
- Decision: Create a separate workspace to hold the raw source, logs, plans, and extracted notes.
- Reason: The project is large and needs a stable operating record from the start.

## D-002 - Use documentation-first tracking

- Date: 2026-05-20
- Status: Accepted
- Decision: Track work in a work log, decision log, backlog, and phase plan before implementation starts.
- Reason: The request explicitly requires step-by-step progress recording.

## D-003 - Treat the current PDF as an unreliable source

- Date: 2026-05-20
- Status: Accepted
- Decision: Do not treat the current PDF as a complete authoritative source until a cleaner copy is obtained.
- Reason: Pages 1 and 2 appear partially corrupted or incomplete, and the file is much smaller than expected.

## D-004 - Use Yaba, Lagos as the current pilot assumption

- Date: 2026-05-20
- Status: Provisional
- Decision: Use Yaba, Lagos as the working pilot location unless later source material overrides it.
- Reason: The readable section of the source explicitly recommends Yaba, Lagos for first launch.

## D-005 - Focus the MVP on trusted neighborhood emergency escalation

- Date: 2026-05-20
- Status: Provisional
- Decision: Define the first product problem as trusted neighborhood emergency alerting and response coordination.
- Reason: This matches the readable source and keeps the first release narrow enough to execute.

## D-006 - Start with a small actor set

- Date: 2026-05-20
- Status: Provisional
- Decision: The first operational model will center on residents, verified responders, platform operators, and trust administrators.
- Reason: This is the smallest actor set that can support the pilot safely.

## D-007 - Recommend a low-data web-first MVP

- Date: 2026-05-20
- Status: Provisional
- Decision: Recommend a web app with PWA support plus an operator console before building separate native apps.
- Reason: It reduces cost and complexity while supporting fast pilot learning.

## D-008 - Make responder verification a required gate

- Date: 2026-05-20
- Status: Accepted
- Decision: Do not allow trusted responder status without a documented approval workflow.
- Reason: Trust is core to the product and cannot be handled as an afterthought.

## D-009 - Use a zero-dependency local prototype for immediate execution

- Date: 2026-05-20
- Status: Accepted
- Decision: Start the first implementation pass with a Node-served local prototype that has no external package dependency.
- Reason: It allows immediate progress and testing on the current machine before framework and infrastructure hardening.

## D-010 - Use file-backed local persistence before introducing a database

- Date: 2026-05-20
- Status: Accepted
- Decision: Persist prototype state to a local JSON file before moving to a full database layer.
- Reason: It provides durability and faster iteration without adding dependency or infrastructure overhead yet.

## D-012 - Align Technical Stack with Master Blueprint

- Date: 2026-05-20
- Status: Accepted
- Decision: Adopt the technical architecture specified in Section 11 of the master blueprint: **Flutter** (Frontend), **NestJS** (Backend), **PostgreSQL/PostGIS** (Database).
- Reason: Strictly aligning with the user's "Masterpiece Project" vision and ensuring the infrastructure is scalable and capable of precise geospatial coordination.

## D-013 - Adopt 7-Stage Incident Flow

- Date: 2026-05-20
- Status: Accepted
- Decision: Implement the exact 7-stage incident lifecycle defined in Section 6 (Detection, Collection, Validation, Coordination, Escalation, Tracking, Resolution).
- Reason: Ensures coordination consistency and reliability as prescribed in the master blueprint.

## D-014 - Enter Infrastructure Execution Phase

- Date: 2026-05-21
- Status: Accepted
- Decision: Shift engineering priority from feature expansion to operational reliability, field validation, governance, auditability, and failure recovery.
- Reason: The platform must now be evaluated as civic coordination infrastructure that survives degraded telecom, device restrictions, human stress, and institutional handoff.

## D-015 - Keep field-readiness thresholds strict

- Date: 2026-05-21
- Status: Accepted
- Decision: The Yaba field drill gate may fail until the system meets survivability thresholds; thresholds should not be weakened to create artificial readiness.
- Reason: Operational readiness must reflect emergency conditions, not demonstration success.

## D-016 - Model operational stress as a first-class engineering input

- Date: 2026-05-21
- Status: Accepted
- Decision: Add adversarial stress scenarios for offline recovery, reconnect storms, human confusion, operator fatigue, telecom instability, trust attacks, and disaster-mode scarcity.
- Reason: Infrastructure engineering must expose hidden failure conditions early instead of optimizing for green tests.

## D-017 - Separate hardening primitives from readiness gates

- Date: 2026-05-21
- Status: Accepted
- Decision: Implement deterministic hardening primitives while keeping field and stress gates strict until end-to-end survivability improves.
- Reason: Passing unit-level controls does not prove operational readiness under degraded telecom, mobile process termination, overload, or disaster scarcity.

## D-018 - Adopt graceful degradation as the resilience model

- Date: 2026-05-21
- Status: Accepted
- Decision: Model explicit degraded operating states and containment boundaries instead of assuming the system must either fully work or fully fail.
- Reason: Real civic infrastructure must remain operationally survivable during partial telecom, trust, database, operator, responder, institutional, and regional failures.

## D-019 - Treat convergence as a system-level readiness gate

- Date: 2026-05-21
- Status: Accepted
- Decision: Add integrated convergence drills that fail when degraded modes interact unsafely, even if individual recovery checkpoints are complete.
- Reason: Emergent instability can appear from interactions between individually correct resilience primitives.

## D-020 - Require stabilization windows and confidence before recovery exit

- Date: 2026-05-21
- Status: Accepted
- Decision: Degraded-mode exit requires checkpoint completion, stabilization windows, convergence confidence, no critical emergent risks, and human acknowledgment where required.
- Reason: Premature recovery can create secondary instability even when individual components report recovery.

## D-021 - Make resilience adaptive to uncertainty history

- Date: 2026-05-21
- Status: Accepted
- Decision: Recovery thresholds, stabilization windows, and recovery actions adapt based on instability memory, propagation, recurrence, oscillation, and human uncertainty.
- Reason: A system that has recently oscillated or rolled back should require stronger evidence before restoring normal operations.

## D-022 - Treat long-horizon trust durability as an infrastructure gate

- Date: 2026-05-21
- Status: Accepted
- Decision: Add strategic maturity evaluation for chronic instability, operational trust durability, institutional reliability, regional readiness, and governance posture.
- Reason: Real civic coordination infrastructure must survive prolonged instability and institutional inconsistency, not only isolated emergencies.

## D-023 - Treat deployment as a governed risk surface

- Date: 2026-05-21
- Status: Accepted
- Decision: Add pre-deployment civic governance evaluation for activation, limited operation, remediation, freeze, authority boundaries, civic safeguards, liability, and safe pilot governance.
- Reason: Technical and strategic maturity do not automatically create public deployment permission.

## D-024 - Treat the Yaba pilot as controlled infrastructure validation

- Date: 2026-05-21
- Status: Accepted
- Decision: Add field pilot preparation gates for scope limits, human preparation, live observability, safety constraints, telecom validation, and shutdown triggers.
- Reason: A civic pilot must behave like critical infrastructure validation, not a consumer launch or broad rollout.

## D-025 - Let observed field truth override simulation

- Date: 2026-05-21
- Status: Accepted
- Decision: Add pre-certification validation for observed field truth, blind spots, human factors, governance durability, and certification state.
- Reason: Real-world telecom, device, human, institutional, and governance behavior must override assumptions before operational certification.
# 2026-05-21 - Reality Validation Does Not Override Readiness

Decision: controlled reality validation may classify or stop experiments, but it cannot declare readiness while field, stress, or convergence gates fail.

Reason: limited field observation is an evidence-gathering process. Treating it as certification would create false operational confidence and weaken the deployment-readiness boundary.

Consequence: `field:reality` can pass while `field:test`, `field:stress`, or `field:convergence` continue failing. This is acceptable and intentional.

# 2026-05-21 - Preserve Removable Civic Infrastructure

Decision: existential safety controls must detect irreversible dependency, coordination monopoly, non-removability, unsafe collapse, and civilization-scale coupling, and must freeze or restrict operation when these risks appear.

Reason: civic coordination infrastructure becomes societally dangerous if communities, institutions, responders, or governance structures lose the ability to function without it.

Consequence: `field:existential` can pass as a control validation, but it cannot certify readiness, authorize expansion, or override failed readiness, stress, convergence, telecom, trust, or operational survivability gates.

# 2026-05-21 - Pivot To Operational Infrastructure Execution

Decision: stop adding abstract civic layers and prioritize concrete deployment, telecom, mobile, operator, security, observability, scale, and convergence execution.

Reason: the platform must now move from conceptually safe architecture to operationally survivable Nigerian emergency coordination infrastructure.

Consequence: new work should directly improve `field:test`, `field:stress`, `field:convergence`, production deployment architecture, real telecom integration, mobile survivability, operator workflows, security controls, and observability.

# 2026-05-21 - Remove File-Backed State From Production Path

Decision: production runtime must select the Postgres-backed operational store when `DATABASE_URL` is configured; file-backed state is allowed only as an explicit local/test fallback.

Reason: incident, responder, operator, trust, telecom receipt, and replay state must be transactional, recoverable, queryable, and reconstructable across process restarts and distributed workers.

Consequence: production deployment now requires database migrations before live operation, and Redis can be rebuilt from Postgres after cache/stream loss.
