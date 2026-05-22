# Institutional Failure Model

Status: Initial resilience baseline.

## Failure Conditions

- Clinic does not acknowledge escalation.
- Police or institutional node is unreachable.
- Responder abandons accepted incident.
- Operator misclassifies incident severity.
- Regional communication blackout isolates local operators.
- Governance reviewer is unavailable during trust anomaly.
- Institution is saturated and cannot accept more handoffs.

## Degraded Coordination Responses

- Clinic non-response: escalate to alternate clinic or supervisor after threshold; preserve failed contact attempts.
- Responder abandonment: freeze responder assignment, route to backup responder or institution, and trigger trust review.
- Operator misclassification: allow supervisor correction through appended audit event, never silent timeline edit.
- Regional blackout: continue local incident queueing and delay cross-region reconciliation until backhaul returns.
- Governance failure: place trust-sensitive actions in pending freeze until authorized reviewer is available.
- Institution saturation: shift to scarcity mode and prioritize critical life-safety incidents.

## Audit Requirements

- Every failed institutional contact must record channel, timestamp, actor, and next fallback.
- Every abandonment event must link responder, incident, elapsed time, and operator action.
- Every misclassification correction must append reason and approving actor.
- Every regional isolation period must record start, end, affected region, and reconciliation outcome.
