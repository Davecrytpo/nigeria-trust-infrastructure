# Trust and Response Model

Status: Working draft based on partial source material.

## Operating Principle

Trust is a product feature and an operational process. The system should not treat responder access as open enrollment.

## Responder Tiers

### Tier 1 - Verified Community Responder

Allowed to receive alerts inside approved territory and for approved incident categories.

### Tier 2 - Institutional Responder

Represents a clinic, school, estate, company, or partner organization with more formal operating authority.

### Tier 3 - Platform Operator

Does not physically respond by default, but can monitor, escalate, reassign, and record incident decisions.

## Suggested Verification Steps

1. Basic identity capture
2. Phone verification
3. Address or operating-base verification
4. Role proof or organization proof
5. Reference check or community endorsement
6. Training on platform rules
7. Territory assignment
8. Approval by trust administrator

## Incident Lifecycle

1. Alert created
2. Basic validation
3. Responder notification
4. Responder acceptance or rejection
5. Operator intervention if needed
6. Arrival and status updates
7. Resolution
8. Review and audit

## Response Rules

- responders should only receive incidents in approved zones
- responders should only receive incident types they are cleared to handle
- unresolved incidents should escalate after a short no-response window
- sensitive actions must be logged
- operator overrides must be visible in the audit trail

## Abuse and Safety Controls

- false alerts should be reviewable
- repeated abuse should trigger suspension
- responder impersonation should trigger immediate lockout
- location access should be limited to active incident context
- manual review should exist for serious complaints

## Trust Signals To Expose In Product

- verification badge
- responder category
- assigned territory
- current availability
- last active status

## What Must Be Manual At First

- responder approval
- territory assignment
- suspension decisions
- serious incident review

Automation can expand later, but should not replace trust judgment too early.
