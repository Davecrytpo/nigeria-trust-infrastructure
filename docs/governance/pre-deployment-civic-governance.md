# Pre-Deployment Civic Governance

Status: Initial governance-grade deployment baseline.

## Purpose

Deployment is a risk surface. The platform must not treat technical maturity, adaptive policy success, or strong documentation as permission to operate. Civic deployment requires governed activation, public trust safeguards, liability controls, pilot supervision, and explicit authority boundaries.

## Deployment Governance Decisions

- `activate-controlled-pilot`: all readiness, convergence, governance, trust, audit, institutional, review board, and critical-risk conditions are satisfied.
- `shadow-or-limited-hours-only`: maturity is high enough for controlled observation or limited supervised operation, but full activation is blocked.
- `governance-remediation-required`: the platform is not deployment-ready and must improve governance controls.
- `do-not-activate`: activation is unsafe.

## Required Approval Roles

- Pilot review board.
- Operations supervisor.
- Trust administrator.
- Institutional liaison.
- Field coordinator.
- Audit reviewer.

## Freeze And Shutdown Triggers

- Unresolved critical convergence risks.
- Severe liability exposure.
- Evidence integrity compromise.
- Civic trust safeguard failure.
- Responder misconduct or collusion risk.
- Disaster-mode instability without supervisor clarity.
- Governance review board unavailable during trust anomaly.

## Authority Boundaries

- Shift operator: normal triage, documentation, and supervisor review request.
- Operations supervisor: rollback to degraded mode, operator queue partitioning, staged recovery approval.
- Trust administrator and review board: responder freeze, trust restriction, evidence review.
- Emergency shutdown or disaster supervisor: pause noncritical dispatch, activate disaster mode, force institutional escalation.

No role receives uncontrolled authority. Every override must produce an audit event.
