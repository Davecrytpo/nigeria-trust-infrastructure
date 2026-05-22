# Recovery Convergence Stabilization

Status: Initial operational convergence baseline.

## Recovery Rule

Recovery is not complete when systems restart or checklists are marked done. Recovery is complete only when technical state, operational state, trust state, human acknowledgment, and convergence confidence are stable together.

## Required Recovery Gates

- Checkpoint completion: every active degraded mode has completed its required recovery checkpoints.
- Stabilization window: recovered signals remain stable for the required mode-specific cooldown period.
- Live telemetry stability: active signals no longer produce critical emergent risks.
- Replay convergence: divergent queue and timeline segments are resolved or quarantined with audit records.
- Telecom confidence normalization: delivery uncertainty remains within acceptable confidence windows.
- Trust-state stabilization: trust anomalies are reviewed and confidence bands are normalized or explicitly restricted.
- Queue reconciliation completion: SMS, app, and local queue backlogs are reconciled before normal mode resumes.
- Human acknowledgment: operator or supervisor confirms situational clarity before exit.

## Stabilization Windows

- Telecom degraded mode: 30 minutes of stable telecom health and closed receipt confidence window.
- SMS-only mode: 20 minutes of restored app connectivity and reconciled SMS backlog.
- Low-trust mode: 60 minutes after trust anomaly review and confidence stabilization.
- Operator-overload mode: 30 minutes below overload threshold plus supervisor acknowledgment.
- Responder-scarcity mode: 45 minutes of restored responder coverage and cleared critical queue.
- Disaster-surge mode: 90 minutes of stable incident rate, cluster review, and institutional capacity confirmation.
- Partial database recovery mode: 45 minutes after replay divergence resolution and canonical checkpoint.
- Regional isolation mode: 60 minutes after backhaul restoration and regional queue reconciliation.

## Recovery Actions

- `controlled-exit`: all gates are satisfied, convergence confidence is ready, and no critical emergent risks remain.
- `staged-exit-with-supervisor-watch`: gates are satisfied but confidence is cautious; exit only in dependency order under supervisor monitoring.
- `hold-and-stabilize`: evidence is incomplete or confidence is unstable; remain degraded and continue observation.
- `rollback-to-degraded-mode`: critical emergent risks or unsafe confidence remain active; stop restoration and contain blast radius.
- `safe-partial-recovery`: adaptive confidence supports constrained capability restoration but not full normalization.
- `persist-degraded-or-rollback`: adaptive confidence falls below dynamic hold threshold or critical risks remain active.

## Dependency-Aware Exit Order

1. Partial database recovery.
2. Regional isolation.
3. Telecom degraded mode.
4. SMS-only mode.
5. Low-trust mode.
6. Operator-overload mode.
7. Responder-scarcity mode.
8. Disaster-surge mode.

The ordering is conservative. Timeline integrity and regional reconciliation come before trust, operator, and disaster normalization because corrupted state can mislead every downstream workflow.

## Adaptive Extension

Recovery thresholds are no longer fixed. Repeated instability, recovery rollback history, oscillation, human fatigue, trust volatility, replay divergence, and cross-layer propagation increase conservatism. The system may require longer stabilization windows or only allow partial recovery.
