const EVENT_PRECEDENCE = {
  created: 10,
  notified: 20,
  acknowledged: 30,
  dispatched: 40,
  arrived: 50,
  escalated: 60,
  resolved: 70
};

function stableEventKey(event) {
  if (event.idempotencyKey) return event.idempotencyKey;
  if (event.id) return event.id;

  return [
    event.incidentId ?? "unknown-incident",
    event.actor ?? "unknown-actor",
    event.type ?? "unknown-type",
    event.clientSequence ?? "unknown-sequence"
  ].join(":");
}

function parseTime(value) {
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

export function reconcileIncidentEvents(events, options = {}) {
  const serverReceivedAt = options.serverReceivedAt ?? new Date().toISOString();
  const seen = new Map();
  const quarantined = [];

  for (const event of events) {
    const key = stableEventKey(event);

    if (!event || typeof event !== "object" || !event.type || !event.actor) {
      quarantined.push({ event, reason: "malformed-event" });
      continue;
    }

    if (event.queueSegmentStatus === "corrupt") {
      quarantined.push({ event, reason: "corrupt-queue-segment" });
      continue;
    }

    const normalized = {
      ...event,
      idempotencyKey: key,
      clientAt: event.clientAt ?? event.at ?? serverReceivedAt,
      receivedAt: event.receivedAt ?? serverReceivedAt,
      precedence: EVENT_PRECEDENCE[event.type] ?? 999
    };

    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, normalized);
      continue;
    }

    const existingReceivedAt = parseTime(existing.receivedAt);
    const candidateReceivedAt = parseTime(normalized.receivedAt);
    if (candidateReceivedAt > existingReceivedAt) {
      seen.set(key, normalized);
    }
  }

  const canonicalEvents = Array.from(seen.values()).sort((left, right) => {
    if (left.precedence !== right.precedence) return left.precedence - right.precedence;
    const clientDelta = parseTime(left.clientAt) - parseTime(right.clientAt);
    if (clientDelta !== 0) return clientDelta;
    const receivedDelta = parseTime(left.receivedAt) - parseTime(right.receivedAt);
    if (receivedDelta !== 0) return receivedDelta;
    return String(left.idempotencyKey).localeCompare(String(right.idempotencyKey));
  });

  return {
    canonicalEvents,
    quarantined,
    duplicateSuppressedCount: events.length - canonicalEvents.length - quarantined.length,
    divergenceDetected: quarantined.length > 0 || events.length !== canonicalEvents.length
  };
}

export function reconstructAuthoritativeTimeline(incident) {
  const reconciliation = reconcileIncidentEvents(incident.events ?? [], {
    serverReceivedAt: incident.createdAt ?? new Date().toISOString()
  });

  return {
    incidentId: incident.id,
    status: incident.status,
    canonicalEvents: reconciliation.canonicalEvents,
    auditFlags: {
      duplicateSuppressedCount: reconciliation.duplicateSuppressedCount,
      quarantinedCount: reconciliation.quarantined.length,
      divergenceDetected: reconciliation.divergenceDetected
    }
  };
}
