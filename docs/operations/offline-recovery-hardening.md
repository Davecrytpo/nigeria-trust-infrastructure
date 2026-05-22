# Offline Recovery Hardening

Status: Engineering requirements baseline.

## Failure Conditions To Survive

- Android kills the process after panic trigger but before sync.
- User submits while offline and reconnects repeatedly.
- SQLite queue has a partially written event after battery loss.
- SMS arrives late after app event already synced.
- Delivery receipt is dropped or duplicated.
- Reconnect storm replays the same event multiple times.
- Client clock differs from server clock.

## Required Design Controls

- Every client event must have a stable idempotency key generated before network attempt.
- Offline queue writes must be atomic and recoverable after partial write.
- Queue replay must use acknowledgments, not blind deletion after send.
- Server ingestion must deduplicate by actor, incident, event type, idempotency key, and causal parent.
- Canonical order must use server acceptance sequence while preserving original client timestamp.
- SMS fallback events must reconcile with app-originated events instead of creating automatic duplicate incidents.
- Corrupt local queue segments must be quarantined and uploaded as recovery evidence when possible.

## Acceptance Checks

- Device can lose power during queue write without losing prior confirmed events.
- Reconnect storm cannot create duplicate incident ownership.
- Delayed SMS cannot reopen resolved incidents without operator review.
- Replay after 24 hours offline preserves event order and evidence metadata.
- Queue corruption recovery is visible in audit logs.
