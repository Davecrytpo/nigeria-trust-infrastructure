# Yaba Operational Stress Findings

Status: Initial stress drill result.

## Drill Run

- Date: 2026-05-21
- Command: `npm.cmd run field:stress`
- Scenario file: `data/field-tests/yaba-operational-stress-scenarios.json`
- Result: Failed stress gate

## Failure Map

- `offline-reconnect-storm-sqlite-corruption`: failed acknowledgment latency, offline recovery, duplicate control, and replay consistency.
- `operator-fatigue-confused-users`: failed offline recovery, operator decision latency, and responder reliability.
- `mtn-congestion-duplicate-sms-dropped-receipts`: failed acknowledgment latency, offline recovery, duplicate control, replay consistency, and telecom receipt integrity.
- `coordinated-spam-fake-verification`: failed trust integrity.
- `neighborhood-blackout-flood-disaster`: failed acknowledgment latency, offline recovery, duplicate control, replay consistency, operator decision latency, responder reliability, telecom receipt integrity, and disaster coordination.

## Highest-Risk Signals

- Offline recovery is fragile under reconnect storms, Android termination, low battery, and queue corruption.
- Telecom receipt integrity collapses under duplicate SMS, dropped delivery receipts, 2G fallback, and congestion.
- Operator decision latency degrades when fatigue, confused users, and institutional failure combine.
- Responder reliability collapses under disaster-scale scarcity.
- Trust integrity is vulnerable to coordinated spam, fake verification attempts, and trust score manipulation.

## Engineering Implications

- Offline queue work must come before public pilot expansion.
- SMS reconciliation must be duplicate-safe and receipt-loss tolerant.
- Surge mode needs adaptive priority, operator load shedding, and responder assignment limits.
- Trust workflow cannot rely on score arithmetic alone; it needs adversarial review controls.
- Disaster mode must include institutional overload handling, not only incident clustering.

## Do Not Change

- Do not lower thresholds to create a pass.
- Do not mark these as product bugs only; they are infrastructure readiness failures.
- Do not expand pilot scope until live-device and telecom validation confirms recovery behavior.

## Hardening Progress

- Date: 2026-05-21
- Added tested control primitives for event reconciliation, telecom receipt reconciliation, operator overload triage, and trust attack scoring.
- Verification: `npm.cmd test` passes with adversarial unit coverage.
- Boundary: `npm.cmd run field:stress` still fails all stress scenarios, which means system-level survivability is not yet proven.
