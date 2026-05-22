# System Convergence Findings

Status: Initial integrated resilience result.

## Drill Run

- Date: 2026-05-21
- Command: `npm.cmd run field:convergence`
- Scenario file: `data/field-tests/yaba-convergence-scenarios.json`
- Result: Failed convergence gate

## Failure Map

- `telecom-degraded-operator-overload`: fragile stability from telecom uncertainty increasing manual review while operators are overloaded.
- `regional-isolation-trust-attack`: critical trust-state deadlock risk because regional autonomy conflicts with trust freezes while governance review may be unavailable.
- `sms-only-replay-corruption`: critical replay divergence propagation risk because SMS-only intake continues while canonical timelines are under reconstruction.
- `disaster-surge-responder-scarcity`: critical scarcity escalation feedback loop because repeated escalation does not create real response capacity.
- `controlled-recovery-after-compound-failure`: recovery checkpoints were complete, but active degraded signals still produced critical emergent risks.

## System-Level Interpretation

Component controls are not enough. The convergence gate shows that correct subsystems can still interact unsafely under compound degradation. The platform must treat degradation exit as a combined decision: completed recovery evidence plus stabilized live signals plus operator acknowledgment.

## Required Remediation Themes

- Add live telemetry feeds into degraded-mode and convergence evaluation.
- Surface active modes, emergent risks, containment boundaries, and recovery state in the operator console.
- Block degraded-mode exit when critical emergent risks remain active.
- Add supervisor acknowledgment to recovery exit workflows.
- Add queue and replay stabilization checkpoints before SMS-only mode exits partial database recovery.
- Add scarcity-aware escalation dampening so disaster mode does not repeatedly escalate without capacity.

## Stabilization Update

- Date: 2026-05-21
- Recovery now requires stabilization windows, convergence confidence scoring, and human acknowledgments in addition to checkpoint completion.
- The convergence gate now reports confidence bands and recovery actions.
- Current result: all convergence scenarios still fail; several now correctly require `rollback-to-degraded-mode` despite completed recovery checkpoints.
