# Actor Map

Status: Working draft based on partial source material.

## Primary Actors

### 1. Resident or Requester

Role:
Person in the pilot area who needs emergency help or needs to raise an alert for someone nearby.

Needs:

- fast alert creation
- simple incident type selection
- clear location sharing
- confidence that responders are real
- visible status updates

Risks:

- panic-driven mistakes
- poor connectivity
- false or malicious alerts

### 2. Verified Community Responder

Role:
Trusted local person or team approved to receive and act on certain incidents.

Examples:

- community safety volunteer
- clinic-linked medical responder
- building or estate security lead
- neighborhood coordinator

Needs:

- verified territory assignment
- fast incident details
- route or location clarity
- ability to accept or decline
- post-incident logging

Risks:

- impersonation
- over-assignment
- unsafe self-deployment

### 3. Platform Operator

Role:
Human operator who monitors incoming incidents, checks escalation rules, manages trust issues, and supports coordination when automation is not enough.

Needs:

- live incident dashboard
- responder visibility
- manual reassignment tools
- abuse review tools
- audit trail access

### 4. Trust Administrator

Role:
Person responsible for responder verification, suspensions, approvals, and role changes.

Needs:

- identity review workflow
- document tracking
- decision history
- territory and permission controls

### 5. Partner Organization

Role:
Clinic, school, estate, community association, or private safety group connected to the pilot.

Needs:

- limited admin access
- responder roster management
- incident reporting visibility

## Future Actors

- police liaison
- ambulance or hospital liaison
- municipal operations center
- insurance or welfare partner

These should not block the first pilot.

## Core Interaction Model

1. Resident creates alert.
2. System identifies pilot zone and incident type.
3. Verified responders in the right territory are notified.
4. Operator watches the incident and intervenes if needed.
5. Incident is resolved, reviewed, and logged.
