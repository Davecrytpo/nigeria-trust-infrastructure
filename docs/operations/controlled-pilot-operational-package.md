# Controlled Pilot Operational Package

This package is for supervised Yaba preparation only. Pilot activation remains blocked until live VPS, telecom, Android, recovery, observability, security, and signed operational reports are complete.

## Pilot Activation Checklist

- Supervisor signs activation for Yaba only.
- Incident categories are limited to low-risk configured categories.
- Responder list is limited and contact-verified.
- Operator concurrency limit is configured.
- Pilot shutdown endpoint is tested.
- Runtime evidence manifest is current.
- Telecom providers have live receipt evidence.
- Android devices have physical validation evidence.
- Daily review owner is assigned.

## Operator Onboarding Guide

- Use only assigned operator identity.
- Do not share operator session.
- Claim one queue item at a time unless supervisor authorizes otherwise.
- Escalate uncertain incidents instead of improvising.
- Record manual decisions in the operational log.
- Stop intake immediately if supervisor triggers pilot shutdown.

## Responder Onboarding Guide

- Confirm identity, phone number, and operating boundary.
- Confirm response categories allowed during pilot.
- Confirm no self-dispatch outside supervisor-approved flow.
- Confirm incident acknowledgment process.
- Confirm safety-first refusal rules.
- Confirm end-of-day feedback channel.

## Supervisor Escalation Guide

Supervisor can:

- Activate pilot shutdown.
- Reassign operator queue items.
- Freeze telecom provider use.
- Move operation into degraded mode.
- Require manual-only handling.
- End the pilot day.

Escalation must include timestamp, reason, affected incidents, and recovery condition.

## Audit Evidence Procedures

Preserve:

- Compose service state.
- API logs.
- Worker logs.
- Postgres backup.
- Redis recovery logs.
- Prometheus/Grafana screenshots or exports.
- Telecom send and receipt reports.
- Android screenshots, logcat, battery, connectivity, and sync evidence.
- Supervisor decisions.

Run after each pilot session:

```bash
npm run evidence:package
npm run evidence:hash
```

## Pilot Shutdown Authority Flow

1. Supervisor decides shutdown.
2. Operator lead acknowledges shutdown.
3. API shutdown control is activated or ingress blocks public intake.
4. Existing incidents are manually reviewed.
5. Evidence is frozen.
6. Reopening requires supervisor sign-off and passing recovery checks.

## Daily Operational Review Checklist

- Incidents created, accepted, rejected, and manually escalated.
- Operator queue depth and overload moments.
- Responder availability and response gaps.
- Telecom submit latency and receipt latency.
- Duplicate or delayed receipts.
- Android offline replay outcomes.
- API, Redis, Postgres, and worker health.
- Metrics anomalies.
- Security/audit exceptions.
- Shutdown or degraded-mode decisions.
- Unresolved operational risks for the next session.
