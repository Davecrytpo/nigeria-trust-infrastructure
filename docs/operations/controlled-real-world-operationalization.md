# Controlled Real-World Operationalization

Status: Limited live learning baseline.

## Purpose

Controlled real-world operationalization allows the platform to learn from supervised civic operations without treating live exposure as readiness certification.

## Pilot Limits

- Geography: one small neighborhood only.
- Population: no more than 150 residents in the live learning window.
- Responders: no more than 12 verified responders.
- Operators: at least 2 operators during live windows.
- Supervisors: at least 1 named supervisor with shutdown authority.
- Hours: no more than 4 live operational hours per day.
- Rollback: rollback plan must be tested before live operation.
- Audit: every live incident requires a mandatory audit trail.

## Permitted Initial Categories

- Welfare checks.
- Low-severity medical assistance.
- Neighborhood coordination.
- Blackout coordination.
- Flood awareness.
- Non-violent incident reporting.

## Excluded Initial Categories

- Armed robbery response.
- Kidnapping escalation.
- Violent confrontation coordination.
- Domestic violence response.
- Major medical emergency response.
- Fire-inside-building response.
- High-authority intervention workflows.

## Required Live Observations

- Telecom: SMS latency distributions, provider asymmetry, Android OEM inconsistency, offline sync restoration, low-battery delivery failures, and network oscillation.
- Human behavior: operator hesitation, responder confusion, escalation inconsistency, panic misuse, fatigue accumulation, responder abandonment, and alert interpretation drift.
- Governance friction: institutional delay, approval bottlenecks, authority ambiguity, supervisor disagreement, escalation disputes, and accountability friction.

## Incident Review Rule

Every live incident must complete:

- Replay review.
- Governance review.
- Responder review.
- Telecom review.
- Operational confusion review.
- Model divergence review.
- Uncertainty reassessment.

Incomplete incidents may not be used as operational truth.

## Decision States

- `limited-live-low-risk-observation`: narrow low-risk observation may proceed.
- `restricted-supervised-live-learning`: live learning may continue only with added restrictions.
- `shadow-only-until-review-discipline-recovers`: review discipline is too weak for live truth claims.
- `do-not-run-or-pause-live-pilot`: scope, telecom, human, or governance conditions are unsafe.

## Non-Certifying Boundary

Live operational learning does not certify readiness. Failed `field:test`, `field:stress`, or `field:convergence` gates remain authoritative blockers for readiness claims.
