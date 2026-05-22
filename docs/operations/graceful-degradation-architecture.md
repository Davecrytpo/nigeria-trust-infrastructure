# Graceful Degradation Architecture

Status: Initial resilience baseline.

## Principle

The platform should not assume all dependencies are healthy. During partial failure, it must reduce capability, contain blast radius, preserve audit integrity, and keep humans oriented. The goal is survivability under degradation, not perfect service.

## Degraded Modes

- Normal mode: app, SMS, operator dashboard, responder dispatch, trust automation, and incident replay are available.
- Telecom degraded mode: app and SMS remain usable, but SMS state changes require confidence windows and delayed consistency.
- SMS-only mode: app connectivity is unreliable; incident intake continues through SMS with manual operator review.
- Low-trust mode: trust confidence is degraded; dispatch expansion requires supervisor approval and high-risk entities are frozen.
- Operator-overload mode: noncritical work is suppressed, incidents are priority-triaged, and supervisors receive immediate incidents.
- Responder-scarcity mode: scarce responders are reserved for critical incidents; lower severity incidents shift to institutional review.
- Disaster-surge mode: incidents are clustered, institutional broadcast is prioritized, and the operator view is condensed.
- Partial database recovery mode: timelines become read-only, replay divergence is quarantined, and authoritative reconstruction is required.
- Regional isolation mode: local queues continue, regional autonomy is allowed, and reconciliation is delayed until backhaul returns.

## Mode Selection Signals

- Telecom health score below threshold.
- App connectivity collapse with SMS still available.
- Trust confidence degradation from spam, collusion, or verification anomalies.
- Operator load above safe triage capacity.
- Responder-to-incident ratio below safe operating threshold.
- Active incidents or disaster signals above surge threshold.
- Database write failure or replay divergence above tolerance.
- Regional backhaul outage.

## Capability Reduction

Degraded mode should remove unsafe capabilities before it removes essential coordination. For example, low-trust mode should restrict automatic dispatch expansion, but it should not prevent supervisor-reviewed institutional escalation. Telecom degraded mode should delay state certainty, not discard SMS intake.

## Engineering Boundary

The prototype now contains deterministic degraded-mode and containment primitives. Production readiness still requires integration with durable storage, mobile offline queues, SMS gateway health checks, operator dashboards, and governance workflows.

## Convergence Boundary

Degraded mode exit must not be based only on component recovery. Recovery requires convergence: checkpoints complete, live signals stabilized, and operator acknowledgment recorded. If emergent risks remain active, the system must hold degraded mode.
