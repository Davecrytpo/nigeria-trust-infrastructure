import pg from "pg";
import {
  INCIDENT_TYPES,
  PILOT_NEIGHBORHOOD,
  RESPONDER_TYPES,
  SEVERITY_OPTIONS,
  getIncidentType
} from "../../../../packages/shared-types/src/domain.js";
import { createEventInfrastructure } from "./event-infrastructure.js";

const { Pool } = pg;

function rowToIncident(row, responder = null, events = []) {
  const incidentType = getIncidentType(row.incident_type);

  return {
    id: row.id,
    requesterName: row.requester_ref,
    incidentType: row.incident_type,
    incidentTypeLabel: incidentType.label,
    severity: row.severity,
    status: row.status,
    version: row.version ?? 1,
    locationNote: row.location_note,
    sharePreciseLocation: Boolean(row.precise_location),
    neighborhoodId: row.neighborhood_id,
    clientMutationId: row.client_mutation_id,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    assignedResponderId: row.assigned_responder_id,
    assignedResponder: responder,
    events
  };
}

function rowToResponder(row) {
  if (!row) return null;

  return {
    id: row.id,
    fullName: row.full_name,
    responderType: row.responder_type,
    verificationStatus: row.verification_status,
    availability: row.availability,
    trustScore: row.trust_score,
    territory: row.territory,
    supportedIncidentTypes: row.supported_incident_types ?? []
  };
}

function eventPayload(type, message, actor = "system") {
  return {
    type,
    message,
    actor,
    at: new Date().toISOString()
  };
}

export function createPostgresStore(options = {}) {
  const pool = options.pool ?? new Pool({ connectionString: options.connectionString ?? process.env.DATABASE_URL });
  const eventInfrastructure = options.eventInfrastructure ?? createEventInfrastructure(options.eventInfrastructureOptions);

  async function appendIncidentEvent(client, { incidentId, type, actor, payload, idempotencyKey }) {
    const result = await client.query(
      `
        INSERT INTO incident_events (incident_id, event_type, actor_ref, idempotency_key, payload)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (idempotency_key) DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
        RETURNING id, incident_id, sequence, event_type, actor_ref, payload, recorded_at
      `,
      [incidentId, type, actor, idempotencyKey, payload]
    );

    const row = result.rows[0];
    await eventInfrastructure.appendEvent({
      incidentId,
      type,
      actor,
      payload,
      idempotencyKey
    });

    return row;
  }

  async function enqueueDelivery(client, job) {
    const result = await client.query(
      `
        INSERT INTO delivery_outbox (incident_id, channel, recipient, message, provider_order)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, incident_id, channel, recipient, message, provider_order, status, attempts, max_attempts, next_attempt_at
      `,
      [job.incidentId, job.channel, job.to, job.message, job.providerOrder ?? ["twilio", "africas-talking", "infobip"]]
    );

    await eventInfrastructure.enqueueDelivery({
      id: result.rows[0].id,
      incidentId: job.incidentId,
      channel: job.channel,
      to: job.to,
      message: job.message,
      providerOrder: job.providerOrder
    });

    return result.rows[0];
  }

  async function findMatchingResponder(client, incidentType) {
    const result = await client.query(
      `
        SELECT *
        FROM responders
        WHERE verification_status = 'verified'
          AND $1 = ANY(supported_incident_types)
        ORDER BY
          CASE WHEN availability = 'available' THEN 0 ELSE 1 END,
          trust_score DESC,
          last_seen_at DESC NULLS LAST
        LIMIT 1
      `,
      [incidentType]
    );

    return result.rows[0] ?? null;
  }

  async function listIncidents() {
    const result = await pool.query(
      `
        SELECT i.*, row_to_json(r.*) AS responder
        FROM incidents i
        LEFT JOIN responders r ON r.id = i.assigned_responder_id
        ORDER BY i.created_at DESC
      `
    );

    return result.rows.map((row) => rowToIncident(row, rowToResponder(row.responder)));
  }

  async function listResponders() {
    const result = await pool.query("SELECT * FROM responders ORDER BY trust_score DESC, full_name ASC");
    return result.rows.map(rowToResponder);
  }

  async function createIncident(payload) {
    const typeExists = INCIDENT_TYPES.some((item) => item.id === payload.incidentType);
    const severityExists = SEVERITY_OPTIONS.some((item) => item.id === payload.severity);

    if (!typeExists) throw new Error("Unknown incident type.");
    if (!severityExists) throw new Error("Unknown severity level.");

    const incidentType = getIncidentType(payload.incidentType);
    const clientMutationId = payload.clientMutationId?.trim() || payload.idempotencyKey?.trim() || null;
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      const incidentResult = await client.query(
        `
          INSERT INTO incidents (requester_ref, incident_type, severity, location_note, neighborhood_id, client_mutation_id)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (client_mutation_id) WHERE client_mutation_id IS NOT NULL
          DO UPDATE SET client_mutation_id = EXCLUDED.client_mutation_id
          RETURNING *, (xmax = 0) AS inserted
        `,
        [
          payload.requesterName?.trim() || "Resident",
          incidentType.id,
          payload.severity,
          payload.locationNote?.trim() || "Location note not provided.",
          PILOT_NEIGHBORHOOD.id,
          clientMutationId
        ]
      );
      const incident = incidentResult.rows[0];

      if (!incident.inserted) {
        await client.query("COMMIT");
        return {
          incident: rowToIncident(incident),
          matchingResponders: [],
          replayed: true
        };
      }

      await appendIncidentEvent(client, {
        incidentId: incident.id,
        type: "incident.created",
        actor: "resident",
        payload: eventPayload("created", "Resident created a live alert.", "resident"),
        idempotencyKey: `incident:${incident.id}:created`
      });
      await appendIncidentEvent(client, {
        incidentId: incident.id,
        type: "incident.notified",
        actor: "system",
        payload: eventPayload("notified", "Matching responders were notified.", "system"),
        idempotencyKey: `incident:${incident.id}:notified`
      });
      await enqueueDelivery(client, {
        incidentId: incident.id,
        channel: "sms",
        to: "responder-pool",
        message: `New ${incidentType.label} incident in ${PILOT_NEIGHBORHOOD.name}`,
        providerOrder: ["twilio", "africas-talking", "infobip"]
      });
      await client.query(
        `
          INSERT INTO operator_queue_items (incident_id, priority)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `,
        [incident.id, payload.severity === "critical" ? 100 : payload.severity === "high" ? 80 : 50]
      );
      await client.query("COMMIT");

      return {
        incident: rowToIncident(incident, null, [
          eventPayload("created", "Resident created a live alert.", "resident"),
          eventPayload("notified", "Matching responders were notified.", "system")
        ]),
        matchingResponders: []
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async function dispatchIncident(incidentId) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      const incidentResult = await client.query("SELECT * FROM incidents WHERE id = $1 FOR UPDATE", [incidentId]);
      const incident = incidentResult.rows[0];
      if (!incident) throw new Error("Incident not found.");
      if (incident.status === "dispatching" && incident.assigned_responder_id) {
        await client.query("COMMIT");
        return rowToIncident(incident);
      }

      const responder = await findMatchingResponder(client, incident.incident_type);
      if (!responder) {
        await client.query("UPDATE incidents SET status = 'escalated', version = version + 1 WHERE id = $1", [incidentId]);
        await appendIncidentEvent(client, {
          incidentId,
          type: "incident.escalated",
          actor: "ops",
          payload: eventPayload("escalated", "No matching responder was available for dispatch.", "ops"),
          idempotencyKey: `incident:${incidentId}:escalated:no-responder`
        });
        await client.query("COMMIT");
        return rowToIncident({ ...incident, status: "escalated" });
      }

      await client.query(
        "UPDATE incidents SET status = 'dispatching', assigned_responder_id = $2, version = version + 1 WHERE id = $1",
        [incidentId, responder.id]
      );
      await client.query("UPDATE responders SET availability = 'engaged', updated_at = now() WHERE id = $1", [responder.id]);
      await appendIncidentEvent(client, {
        incidentId,
        type: "incident.dispatched",
        actor: "ops",
        payload: {
          ...eventPayload("dispatched", `${responder.full_name} was assigned to the incident.`, "ops"),
          assignedResponderId: responder.id
        },
        idempotencyKey: `incident:${incidentId}:dispatch:${responder.id}`
      });
      await client.query("COMMIT");

      return rowToIncident(
        { ...incident, status: "dispatching", assigned_responder_id: responder.id },
        rowToResponder(responder)
      );
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async function resolveIncident(incidentId) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      const incidentResult = await client.query(
        "UPDATE incidents SET status = 'resolved', resolved_at = now(), version = version + 1 WHERE id = $1 RETURNING *",
        [incidentId]
      );
      const incident = incidentResult.rows[0];
      if (!incident) throw new Error("Incident not found.");

      if (incident.assigned_responder_id) {
        await client.query("UPDATE responders SET availability = 'available', updated_at = now() WHERE id = $1", [incident.assigned_responder_id]);
      }
      await appendIncidentEvent(client, {
        incidentId,
        type: "incident.resolved",
        actor: "ops",
        payload: eventPayload("resolved", "Incident was marked resolved by the operator.", "ops"),
        idempotencyKey: `incident:${incidentId}:resolved`
      });
      await client.query("COMMIT");

      return rowToIncident(incident);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async function getIncidentReplay(incidentId) {
    const result = await pool.query(
      `
        SELECT id, incident_id AS "incidentId", sequence, event_type AS type, actor_ref AS actor, payload, recorded_at AS "recordedAt"
        FROM incident_events
        WHERE incident_id = $1
        ORDER BY sequence ASC
      `,
      [incidentId]
    );

    return result.rows;
  }

  async function recordTelecomReceipt(provider, payload) {
    const result = await pool.query(
      `
        INSERT INTO telecom_receipts (provider, provider_message_id, status, recipient, latency_ms, raw_payload)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (provider, provider_message_id, status)
        DO UPDATE SET duplicate_count = telecom_receipts.duplicate_count + 1, received_at = now()
        RETURNING id, provider, provider_message_id AS "providerMessageId", status, recipient AS to, latency_ms AS "latencyMs", duplicate_count AS "duplicateCount", received_at AS "receivedAt"
      `,
      [provider, payload.providerMessageId, payload.status ?? "unknown", payload.to ?? null, payload.latencyMs ?? null, payload.raw ?? payload]
    );
    await eventInfrastructure.recordReceipt({ provider, ...payload });
    return result.rows[0];
  }

  async function getBootstrap() {
    const [incidents, responders] = await Promise.all([listIncidents(), listResponders()]);
    const activeIncidents = incidents.filter((incident) => incident.status !== "resolved");

    return {
      generatedAt: new Date().toISOString(),
      neighborhood: PILOT_NEIGHBORHOOD,
      incidentTypes: INCIDENT_TYPES,
      responderTypes: RESPONDER_TYPES,
      responders,
      incidents,
      metrics: {
        activeIncidents: activeIncidents.length,
        availableResponders: responders.filter((item) => item.availability === "available").length,
        pendingTrustReviews: 0
      }
    };
  }

  async function getDashboard() {
    const [incidents, responders, queue, trust, presence] = await Promise.all([
      listIncidents(),
      listResponders(),
      pool.query("SELECT status, count(*)::int AS count FROM operator_queue_items GROUP BY status"),
      pool.query("SELECT * FROM trust_reviews WHERE review_status = 'pending' ORDER BY created_at ASC LIMIT 50"),
      pool.query("SELECT actor_ref, actor_type, status, last_seen_at, expires_at FROM presence_sessions WHERE expires_at > now() ORDER BY last_seen_at DESC")
    ]);
    const activeIncidents = incidents.filter((incident) => incident.status !== "resolved");

    return {
      generatedAt: new Date().toISOString(),
      neighborhood: PILOT_NEIGHBORHOOD,
      metrics: {
        totalIncidents: incidents.length,
        activeIncidents: activeIncidents.length,
        criticalIncidents: activeIncidents.filter((incident) => incident.severity === "critical").length,
        availableResponders: responders.filter((item) => item.availability === "available").length,
        engagedResponders: responders.filter((item) => item.availability === "engaged").length
      },
      responders,
      incidents,
      trustQueue: trust.rows,
      operatorQueue: queue.rows,
      presence: presence.rows,
      infrastructure: await eventInfrastructure.listQueueState()
    };
  }

  async function claimOperatorQueueItem(operatorRef = "operator") {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      const result = await client.query(
        `
          WITH next_item AS (
            SELECT id
            FROM operator_queue_items
            WHERE status = 'queued'
               OR (status = 'locked' AND locked_until <= now())
            ORDER BY priority DESC, starvation_score DESC, created_at ASC
            FOR UPDATE SKIP LOCKED
            LIMIT 1
          )
          UPDATE operator_queue_items q
          SET status = 'locked',
              owner_operator_ref = $1,
              locked_until = now() + interval '5 minutes',
              updated_at = now()
          FROM next_item
          WHERE q.id = next_item.id
          RETURNING q.*
        `,
        [operatorRef]
      );
      const item = result.rows[0] ?? null;

      if (item?.incident_id) {
        await client.query(
          `
            UPDATE incidents
            SET operator_owner_ref = $2,
                ownership_locked_until = now() + interval '5 minutes'
            WHERE id = $1
          `,
          [item.incident_id, operatorRef]
        );
      }

      await client.query("COMMIT");
      return item;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async function releaseOperatorQueueItem(queueItemId, operatorRef = "operator") {
    const result = await pool.query(
      `
        UPDATE operator_queue_items
        SET status = 'queued',
            owner_operator_ref = NULL,
            locked_until = NULL,
            updated_at = now()
        WHERE id = $1
          AND (owner_operator_ref IS NULL OR owner_operator_ref = $2)
        RETURNING *
      `,
      [queueItemId, operatorRef]
    );

    if (!result.rows[0]) throw new Error("Operator queue item not found or owned by another operator.");
    return result.rows[0];
  }

  async function reassignOperatorQueueItem(queueItemId, targetOperatorRef, supervisorRef = "supervisor") {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      const result = await client.query(
        `
          UPDATE operator_queue_items
          SET status = 'locked',
              owner_operator_ref = $2,
              locked_until = now() + interval '5 minutes',
              updated_at = now()
          WHERE id = $1
          RETURNING *
        `,
        [queueItemId, targetOperatorRef]
      );
      const item = result.rows[0];
      if (!item) throw new Error("Operator queue item not found.");

      await client.query(
        `
          INSERT INTO audit_records (actor_ref, action, subject_ref, payload, previous_hash, record_hash)
          VALUES ($1, 'operator.queue.reassigned', $2, $3, NULL, encode(digest(($1 || $2 || $3::text || now()::text), 'sha256'), 'hex'))
        `,
        [supervisorRef, queueItemId, { targetOperatorRef }]
      );
      await client.query("COMMIT");
      return item;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async function recordPresence({ actorRef = "operator", actorType = "operator", status = "online" } = {}) {
    const result = await pool.query(
      `
        INSERT INTO presence_sessions (actor_ref, actor_type, status, last_seen_at, expires_at)
        VALUES ($1, $2, $3, now(), now() + interval '45 seconds')
        ON CONFLICT (actor_ref, actor_type)
        DO UPDATE SET status = EXCLUDED.status,
                      last_seen_at = now(),
                      expires_at = now() + interval '45 seconds'
        RETURNING actor_ref AS "actorRef", actor_type AS "actorType", status, last_seen_at AS "lastSeenAt", expires_at AS "expiresAt"
      `,
      [actorRef, actorType, status]
    );

    return result.rows[0];
  }

  return {
    createIncident,
    claimOperatorQueueItem,
    dispatchIncident,
    getBootstrap,
    getDashboard,
    getIncidentReplay,
    listIncidents,
    listResponders,
    recordPresence,
    recordTelecomReceipt,
    reassignOperatorQueueItem,
    releaseOperatorQueueItem,
    resolveIncident,
    eventInfrastructure,
    pool,
    stateBackend: "postgres"
  };
}
