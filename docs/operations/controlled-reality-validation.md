# Controlled Reality Validation

Status: Limited field experimentation baseline.

## Purpose

Controlled reality validation measures how real field behavior diverges from simulated assumptions. It does not certify deployment readiness, override failed readiness gates, or authorize broad rollout.

## Experiment Approval Rules

- Every experiment requires a named supervisor, named rollback authority, enabled audit trail, and recorded participant consent.
- Experiments must remain small: no more than 50 participants and no more than 4 hours per window.
- High-risk incident categories remain outside reality-validation experiments unless a separate governance process authorizes them.
- Live dispatch is blocked unless manual approval is required for every dispatch action.
- Any missing core control moves the experiment to shadow-only or do-not-run mode.

## Reality Signals

- Telecom: actual SMS latency, delayed receipts, silent delivery failures, packet instability, provider disagreement, and background execution failures.
- Human behavior: confusion under stress, inconsistent escalation, panic misuse, emotional overload, delayed comprehension, and supervision dependence.
- Field operations: responder acknowledgment delays, abandonment, operator hesitation, escalation timing variance, GPS drift, battery collapse, and synchronization divergence.
- Governance: review fatigue, skipped oversight, policy drift, supervisor overload, and institutional coordination breakdown.

## Decision Bands

- `run-controlled-reality-experiment`: only small, supervised, observable, reversible experiments with low divergence and no false-confidence indicators.
- `restricted-shadow-or-supervised-experiment`: reality signals are uncertain enough to reduce exposure, increase supervision, or use shadow observation.
- `pause-and-investigate-reality-gap`: observed reality materially contradicts assumptions or hidden fragility remains unexplained.
- `do-not-run-or-stop-experiment`: safety controls are missing, human chaos is severe, fatigue is unsafe, or false confidence is critical.

## Non-Override Boundary

Reality validation may discover operational truth and restrict the pilot. It must not mark the platform ready if `field:test`, `field:stress`, or `field:convergence` are failing. The correct outcome is often controlled failure discovery, not green readiness.
