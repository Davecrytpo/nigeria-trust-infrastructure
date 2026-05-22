# Yaba Limited Field Pilot

Status: Controlled field preparation baseline.

## Pilot Shape

The Yaba pilot must remain controlled, supervised, operationally narrow, and intentionally limited. It is not a consumer launch.

## Scope Limits

- Maximum residents: 300.
- Maximum verified responders: 25.
- Minimum operators: 2 active or on-call during pilot window.
- Maximum daily operating window: 8 hours.
- Geography: one neighborhood only.
- Permitted categories: medical support, general help, suspicious activity, and other low-to-medium risk coordination categories approved by the review board.
- Excluded without supervisor-only workflow: kidnap, violent crime, major fire, major medical emergency, domestic violence, and other high-risk categories.

## Initial Live Learning Limits

The first controlled live learning window is stricter than the general pilot preparation envelope:

- Maximum residents: 150.
- Maximum verified responders: 12.
- Minimum operators: 2.
- Minimum supervisor count: 1 named supervisor with shutdown authority.
- Maximum daily operating window: 4 hours.
- Permitted categories only: welfare checks, low-severity medical assistance, neighborhood coordination, blackout coordination, flood awareness, and non-violent incident reporting.
- Excluded categories: armed robbery, kidnapping, violent confrontation, domestic violence, major medical emergencies, fires inside buildings, and high-authority intervention workflows.

## Telecom Boundary

Telecom validation may be limited during early pilot. If SMS, Android background reliability, low-battery behavior, or prolonged offline recovery are not validated, telecom-dependent flows must remain limited, shadowed, or manually reviewed.

## Shutdown Triggers

- Operator overload above safe threshold.
- Replay divergence requiring manual review.
- Trust confidence below dispatch threshold.
- Institutional acknowledgment below safe threshold.
- Active degraded mode without supervisor clarity.
- High-risk incident rate above pilot tolerance.
- Civic trust complaint with evidence integrity risk.

## Pilot Decision Modes

- `run-limited-supervised-pilot`: narrow scope, trained humans, live observability, safety constraints, governance approval, and telecom limits are acceptable.
- `limited-hours-or-shadow-mode`: limited operation or shadow validation only.
- `dry-runs-only`: no live public coordination.
- `pause-or-freeze-pilot`: active safety or governance conditions require pause.
- `do-not-run-field-pilot`: scope, observability, human readiness, or telecom assumptions are unsafe.
