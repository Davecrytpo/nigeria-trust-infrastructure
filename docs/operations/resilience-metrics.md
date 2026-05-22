# Resilience Metrics

Status: Initial observability baseline.

## Degradation Metrics

- Degradation survivability: percentage of incidents that retain owner, stage, priority, and next action during degraded mode.
- Recovery convergence time: time from degraded mode entry to stable authoritative state.
- Replay divergence frequency: divergent or quarantined event segments per incident.
- Queue corruption recovery rate: corrupt segments recovered, quarantined, or safely discarded with audit record.
- Telecom uncertainty rate: low-confidence receipts and phantom confirmations per provider.
- Provider health score: combined receipt confidence and heartbeat status.
- Overload collapse threshold: incident volume per operator where decision latency exceeds safe target.
- Trust uncertainty propagation: number of actors shifted from normal dispatch to supervised, institutional-only, or blocked mode.
- Disaster-mode stability: percentage of clustered incidents that retain individual audit trails and escalation owners.
- Operator fatigue indicator: sustained overload duration, shift length, and unresolved immediate incidents.
- Convergence stability: percentage of compound-degradation scenarios that exit without critical emergent risks.
- Recovery checkpoint completion: required degraded-mode exit checkpoints completed before restoration.
- Emergent risk frequency: critical interaction risks detected per degraded-mode hour.
- Exit rollback rate: degraded modes re-entered after premature recovery.
- Convergence confidence score: weighted confidence across replay, telecom, sync, operator clarity, trust, incident reconciliation, and human acknowledgment.
- Stabilization window compliance: percentage of degraded-mode exits that waited the full required cooldown period.
- Recovery action distribution: controlled exits, staged exits, hold-and-stabilize decisions, and rollbacks.
- Adaptive conservatism: dynamic increase in recovery thresholds and stabilization windows caused by uncertainty.
- Stability memory score: historical pressure from repeated instability, rollback, oscillation, replay divergence, trust volatility, and overload cycles.
- Propagation band: contained, watch, high, or critical cross-layer instability spread.
- Partial recovery rate: percentage of recoveries restored through constrained capability rather than full normalization.
- Chronic risk score: multi-week instability pressure across telecom, overload, disaster recurrence, responder fatigue, replay divergence, and institutional drift.
- Trust durability score: longitudinal trust health across responders, operators, institutions, false reports, chronic instability zones, and volatility.
- Institutional reliability score: partner reliability for acknowledgment, handoff, continuity, authority clarity, overload, and professionalism.
- Regional readiness score: region-specific operational readiness before expansion.
- Governance risk score: combined long-horizon, trust, institutional, and audit risk used to limit or freeze expansion.
- Deployment activation score: governed readiness score for activation, limited operation, remediation, or non-activation.
- Civic safeguard score: transparency, accountability, appeal, misuse reporting, audit visibility, privacy minimization, and anti-surveillance boundary strength.
- Liability score: accountability risk across misconduct, negligence, delay, institutional non-response, telecom failure, escalation dispute, and evidence integrity.
- Pilot governance score: supervision, review board, certification, audit schedule, escalation committee, field coordination, and shutdown readiness.
- Field truth score: observed SMS, Android, battery, GPS, responder, operator, and institutional behavior compared with assumptions.
- Blind spot band: severity of hidden synchronization, replay, confidence, degradation, escalation, operator, and telecom partial-failure risks.
- Human validation score: measured responder, operator, panic, escalation, fatigue, supervision, and uncertainty communication behavior.
- Governance durability score: ability of review, oversight, policy, supervision, and institutional governance to persist under stress.
- Certification state: not certified, restricted supervised validation, or limited operational certification.

## Reporting Rules

- Metrics must describe survivability and degradation, not vanity growth.
- Failed metrics must produce operational actions or engineering tasks.
- Uncertain data must be labeled uncertain rather than hidden.
- Aggregated intelligence must remain infrastructure-focused and avoid surveillance expansion.
