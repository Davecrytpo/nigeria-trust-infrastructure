# Privacy and Safety Baseline

Status: Working draft based on partial source material.

## Core Principle

The platform handles emergency and location data, so privacy and safety controls must exist from the first pilot instead of being added later.

## Minimum Data Collection

Collect only what is needed to:

- identify the user
- place the user in a pilot geography
- route the incident
- verify responders
- review incidents afterward

## Sensitive Data Areas

- live location
- emergency history
- responder identity documents
- operator notes
- abuse reports

## Baseline Rules

- location sharing should be active only in incident context unless a user clearly opts in
- responder verification data should be visible only to authorized trust staff
- operator and admin actions must be auditable
- users should be able to report misuse
- serious trust complaints should require human review

## Working Retention Assumptions

These are draft assumptions for planning:

- incident records: retain for operational and audit needs
- location snapshots: retain only as long as needed for incident review and dispute handling
- verification records: retain while responder status is active and for a defined review period after
- audit logs: retain longer than analytics data

Exact retention periods need legal and operational review.

## Safety Boundaries

- the product should never label an unverified user as trusted help
- the product should never expose responder private information beyond what is needed for coordination
- the platform should make clear when official emergency channels are still required
- operator overrides should always be logged

## Abuse Handling Baseline

- false alerts need warning and suspension rules
- impersonation should trigger immediate investigation
- repeated responder non-performance should trigger review
- access removal should be reversible only through documented admin action
