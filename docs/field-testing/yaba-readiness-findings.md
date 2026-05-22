# Yaba Readiness Findings

Status: Initial deterministic drill result.

## Drill Run

- Date: 2026-05-21
- Command: `npm.cmd run field:test`
- Scenario file: `data/field-tests/yaba-survivability-scenarios.json`
- Result: Failed readiness gate

## Findings

- Weak MTN/Glo panic alert stayed within acknowledgment latency but missed offline recovery target at `0.900` against required `0.950`.
- Delayed SMS with app fallback stayed within acknowledgment latency but missed offline recovery target at `0.903`.
- Android background termination under low battery missed offline recovery target at `0.815`, making it the highest device-risk scenario.
- Multi-incident market surge missed acknowledgment latency at `184333ms` against `180000ms` and missed offline recovery at `0.901`.

## Operational Interpretation

The platform should not enter live Yaba pilot until offline queue recovery, Android survivability, and surge staffing assumptions are strengthened. The correct response is not to lower the threshold. The threshold represents operational reality: a critical incident cannot depend on stable data, foreground app survival, or immediate SMS delivery.

## Required Remediation Themes

- Implement durable local event queues for mobile and responder clients.
- Add SMS provider failover and delivery callback reconciliation.
- Add duplicate-safe event replay with canonical event ordering.
- Define minimum responder-to-incident and operator-to-incident ratios for surge mode.
- Test Android battery saver, background termination, and notification delivery on real low-cost devices.

## Stress Model Extension

- Date: 2026-05-21
- Command: `npm.cmd run field:stress`
- Scenario file: `data/field-tests/yaba-operational-stress-scenarios.json`
- Expected posture: This gate is intentionally adversarial and should fail until offline recovery, telecom reconciliation, surge coordination, trust attack resistance, and disaster-mode controls are implemented.
- Findings: `docs/field-testing/yaba-operational-stress-findings.md`
