# Field Testing Framework

Status: Infrastructure Execution Phase baseline.

## Purpose

Field testing must prove survivability under Nigerian operating conditions, not feature completeness. A scenario passes only when incident detection, acknowledgment, escalation, audit capture, and recovery remain coherent under degraded telecom, device, staffing, and operator conditions.

## Drill Families

- Responder simulation: validate responder availability, acceptance, rejection, handoff, no-response timeout, and territory mismatch behavior.
- Incident replay: replay detection, validation, coordination, escalation, response tracking, resolution, and audit events in canonical order.
- Telecom instability: simulate weak MTN/Glo data, delayed SMS, provider outage, duplicate callbacks, and partial connectivity collapse.
- Operator stress: run simultaneous incidents with limited operators and require explicit escalation ownership.
- Low-battery validation: test panic flows at 5 to 20 percent battery with Android background restrictions enabled.
- Panic usability: verify a distressed user can trigger, confirm, cancel false alarm, and recover from network loss without complex navigation.
- Disaster simulation: validate multi-incident clustering, institutional broadcast, responder load shedding, and disaster-mode governance.

## Required Field Conditions

- Weak data signal with intermittent packet loss.
- Delayed SMS delivery above 90 seconds.
- GPS drift between 50 and 250 meters.
- Android background app termination.
- Battery saver and low-battery device states.
- Offline queue replay after reconnection.
- Operator shift handoff during an active incident.

## Acceptance Metrics

- Incident survivability: critical incident remains actionable after telecom or app failure.
- Acknowledgment latency: first valid responder or operator acknowledgment within threshold.
- Coordination reliability: no incident loses owner, stage, or escalation path.
- Offline recovery success: queued incident events replay once and in order.
- False positive reduction: false alerts are resolved without punishing legitimate distress.
- Operator clarity: every escalation has a named owner and next action.
- Trust retention: sensitive audit events are retained and access-controlled.

## Running Local Drills

The baseline deterministic drill runner uses `data/field-tests/yaba-survivability-scenarios.json`.

```powershell
npm run field:test
```

Run harsher operational stress drills with:

```powershell
npm run field:stress
```

The runner is not a substitute for live field pilots. It is a regression gate for scenario design and operational thresholds before controlled Yaba testing.
