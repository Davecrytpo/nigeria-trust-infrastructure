import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  INCIDENT_TYPES,
  PILOT_NEIGHBORHOOD,
  RESPONDER_TYPES,
  SEVERITY_OPTIONS,
  getIncidentType
} from "../../../../packages/shared-types/src/domain.js";
import { createEventInfrastructure } from "./event-infrastructure.js";
import { createPostgresStore } from "./postgres-store.js";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = resolve(currentFile, "..");
const defaultStateFile = resolve(currentDir, "../../../../data/state.json");

function clone(value) {
  return structuredClone(value);
}

function createId(prefix) {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${random}`;
}

function isoMinutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

function makeEvent(type, message, actor = "system") {
  return {
    id: createId("evt"),
    type,
    message,
    actor,
    at: new Date().toISOString()
  };
}

function seedState() {
  return {
    neighborhood: clone(PILOT_NEIGHBORHOOD),
    trustQueue: [
      {
        id: "verify-adebisi",
        fullName: "Adebisi Ojo",
        responderType: "medical",
        submittedAt: isoMinutesAgo(55),
        status: "pending",
        note: "Clinic referral documents uploaded, awaiting territory assignment."
      }
    ],
    responders: [
      {
        id: "rsp-tade",
        fullName: "Tade Bakare",
        responderType: "community",
        verificationStatus: "verified",
        availability: "available",
        trustScore: 96,
        territory: PILOT_NEIGHBORHOOD.name,
        supportedIncidentTypes: ["medical", "security", "fire"]
      },
      {
        id: "rsp-ife",
        fullName: "Ife Akinyemi",
        responderType: "medical",
        verificationStatus: "verified",
        availability: "available",
        trustScore: 94,
        territory: PILOT_NEIGHBORHOOD.name,
        supportedIncidentTypes: ["medical"]
      },
      {
        id: "rsp-kemi",
        fullName: "Kemi Omotoso",
        responderType: "security",
        verificationStatus: "verified",
        availability: "busy",
        trustScore: 91,
        territory: PILOT_NEIGHBORHOOD.name,
        supportedIncidentTypes: ["security"]
      },
      {
        id: "rsp-femi",
        fullName: "Femi Adewale",
        responderType: "fire",
        verificationStatus: "verified",
        availability: "available",
        trustScore: 90,
        territory: PILOT_NEIGHBORHOOD.name,
        supportedIncidentTypes: ["fire"]
      }
    ],
    incidents: [
      {
        id: "inc-med-001",
        requesterName: "Resident pilot device",
        incidentType: "medical",
        severity: "critical",
        status: "dispatching",
        locationNote: "Near Tejuosho bus stop, opposite the pharmacy line.",
        sharePreciseLocation: true,
        neighborhoodId: PILOT_NEIGHBORHOOD.id,
        createdAt: isoMinutesAgo(12),
        assignedResponderId: "rsp-ife",
        events: [
          {
            id: "evt-001",
            type: "created",
            message: "Alert created from resident app.",
            actor: "resident",
            at: isoMinutesAgo(12)
          },
          {
            id: "evt-002",
            type: "notified",
            message: "Matching responders notified.",
            actor: "system",
            at: isoMinutesAgo(11)
          },
          {
            id: "evt-003",
            type: "dispatched",
            message: "Medical responder accepted and is moving.",
            actor: "ops",
            at: isoMinutesAgo(10)
          }
        ]
      },
      {
        id: "inc-sec-002",
        requesterName: "Community watch desk",
        incidentType: "security",
        severity: "high",
        status: "awaiting-response",
        locationNote: "Alley behind Commercial Avenue loading bays.",
        sharePreciseLocation: false,
        neighborhoodId: PILOT_NEIGHBORHOOD.id,
        createdAt: isoMinutesAgo(4),
        assignedResponderId: null,
        events: [
          {
            id: "evt-004",
            type: "created",
            message: "Suspicious activity alert created.",
            actor: "resident",
            at: isoMinutesAgo(4)
          }
        ]
      }
    ]
  };
}

function normalizeState(parsedState) {
  const seededState = seedState();

  return {
    neighborhood: parsedState?.neighborhood ?? seededState.neighborhood,
    trustQueue: Array.isArray(parsedState?.trustQueue) ? parsedState.trustQueue : seededState.trustQueue,
    responders: Array.isArray(parsedState?.responders) ? parsedState.responders : seededState.responders,
    incidents: Array.isArray(parsedState?.incidents) ? parsedState.incidents : seededState.incidents,
    operatorQueue: Array.isArray(parsedState?.operatorQueue) ? parsedState.operatorQueue : [],
    presence: Array.isArray(parsedState?.presence) ? parsedState.presence : []
  };
}

async function writeStateFile(stateFile, state) {
  await mkdir(dirname(stateFile), { recursive: true });
  const tempFile = `${stateFile}.tmp`;
  await writeFile(tempFile, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  await rename(tempFile, stateFile);
}

async function loadStateFile(stateFile) {
  try {
    const raw = await readFile(stateFile, "utf8");
    return normalizeState(JSON.parse(raw));
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      const seeded = seedState();
      await writeStateFile(stateFile, seeded);
      return seeded;
    }

    throw error;
  }
}

function incidentSummary(incident, responders) {
  const assignedResponder = responders.find((item) => item.id === incident.assignedResponderId) ?? null;
  const incidentType = getIncidentType(incident.incidentType);

  return {
    ...clone(incident),
    incidentTypeLabel: incidentType.label,
    assignedResponder
  };
}

export function createStore(options = {}) {
  if (!options.stateFile && !options.forceFileStore && (options.connectionString || process.env.DATABASE_URL)) {
    return createPostgresStore(options);
  }

  const stateFile = options.stateFile ?? defaultStateFile;
  const eventInfrastructure = options.eventInfrastructure ?? createEventInfrastructure(options.eventInfrastructureOptions);
  let statePromise;
  let saveQueue = Promise.resolve();

  async function readState() {
    if (!statePromise) {
      statePromise = loadStateFile(stateFile);
    }

    return statePromise;
  }

  async function persistState(state) {
    saveQueue = saveQueue.then(() => writeStateFile(stateFile, state));
    await saveQueue;
  }

  async function mutate(mutator) {
    const state = await readState();
    const result = mutator(state);
    await persistState(state);
    return result;
  }

  function matchingResponders(state, incidentType) {
    return state.responders
      .filter((responder) => responder.verificationStatus === "verified")
      .filter((responder) => responder.supportedIncidentTypes.includes(incidentType))
      .sort((left, right) => {
        const availabilityRank = left.availability === "available" ? 0 : 1;
        const otherRank = right.availability === "available" ? 0 : 1;

        if (availabilityRank !== otherRank) {
          return availabilityRank - otherRank;
        }

        return right.trustScore - left.trustScore;
      });
  }

  async function listIncidents() {
    const state = await readState();

    return state.incidents
      .slice()
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .map((incident) => incidentSummary(incident, state.responders));
  }

  async function listResponders() {
    const state = await readState();
    return clone(state.responders).sort((left, right) => right.trustScore - left.trustScore);
  }

  async function createIncident(payload) {
    const typeExists = INCIDENT_TYPES.some((item) => item.id === payload.incidentType);
    const severityExists = SEVERITY_OPTIONS.some((item) => item.id === payload.severity);

    if (!typeExists) {
      throw new Error("Unknown incident type.");
    }

    if (!severityExists) {
      throw new Error("Unknown severity level.");
    }

    const incidentType = getIncidentType(payload.incidentType);

    const result = await mutate((state) => {
      const incident = {
        id: createId("inc"),
        requesterName: payload.requesterName?.trim() || "Resident",
        incidentType: incidentType.id,
        severity: payload.severity,
        status: "awaiting-response",
        locationNote: payload.locationNote?.trim() || "Location note not provided.",
        sharePreciseLocation: Boolean(payload.sharePreciseLocation),
        neighborhoodId: PILOT_NEIGHBORHOOD.id,
        createdAt: new Date().toISOString(),
        version: 1,
        clientMutationId: payload.clientMutationId?.trim() || payload.idempotencyKey?.trim() || null,
        assignedResponderId: null,
        events: [
          makeEvent("created", "Resident created a live alert.", "resident"),
          makeEvent("notified", "Matching responders were notified.", "system")
        ]
      };

      if (incident.clientMutationId) {
        const existing = state.incidents.find((item) => item.clientMutationId === incident.clientMutationId);
        if (existing) {
          return {
            incident: incidentSummary(existing, state.responders),
            matchingResponders: [],
            replayed: true
          };
        }
      }

      state.incidents.unshift(incident);
      state.operatorQueue ??= [];
      state.operatorQueue.push({
        id: createId("queue"),
        incidentId: incident.id,
        queueName: "yaba-primary",
        priority: incident.severity === "critical" ? 100 : incident.severity === "high" ? 80 : 50,
        status: "queued",
        ownerOperatorRef: null,
        lockedUntil: null,
        createdAt: new Date().toISOString()
      });

      return {
        incident: incidentSummary(incident, state.responders),
        matchingResponders: matchingResponders(state, incident.incidentType).slice(0, 3)
      };
    });

    if (!result.replayed) {
      await eventInfrastructure.appendEvent({
        incidentId: result.incident.id,
        type: "incident.created",
        actor: "resident",
        payload: {
          incidentType: result.incident.incidentType,
          severity: result.incident.severity,
          sharePreciseLocation: result.incident.sharePreciseLocation
        },
        idempotencyKey: `incident:${result.incident.id}:created`
      });
      await eventInfrastructure.enqueueDelivery({
        incidentId: result.incident.id,
        channel: "sms",
        to: "responder-pool",
        message: `New ${result.incident.incidentTypeLabel} incident in ${PILOT_NEIGHBORHOOD.name}`,
        providerOrder: ["twilio", "africas-talking", "infobip"]
      });
    }

    return result;
  }

  async function dispatchIncident(incidentId) {
    const result = await mutate((state) => {
      const incident = state.incidents.find((item) => item.id === incidentId);

      if (!incident) {
        throw new Error("Incident not found.");
      }

      if (incident.status === "dispatching" && incident.assignedResponderId) {
        return {
          summary: incidentSummary(incident, state.responders),
          event: null,
          duplicate: true
        };
      }

      const responder = matchingResponders(state, incident.incidentType)[0];

      if (!responder) {
        const event = makeEvent("escalated", "No matching responder was available for dispatch.", "ops");
        incident.status = "escalated";
        incident.version = (incident.version ?? 1) + 1;
        incident.events.push(event);
        return { summary: incidentSummary(incident, state.responders), event };
      }

      incident.status = "dispatching";
      incident.version = (incident.version ?? 1) + 1;
      incident.assignedResponderId = responder.id;
      const event = makeEvent(
        "dispatched",
        `${responder.fullName} was assigned to the incident.`,
        "ops"
      );
      incident.events.push(
        event
      );

      responder.availability = "engaged";

      return { summary: incidentSummary(incident, state.responders), event };
    });

    if (!result.duplicate) {
      await eventInfrastructure.appendEvent({
        incidentId,
        type: result.summary.status === "escalated" ? "incident.escalated" : "incident.dispatched",
        actor: "ops",
        payload: {
          assignedResponderId: result.summary.assignedResponderId,
          event: result.event
        },
        idempotencyKey: result.summary.status === "escalated"
          ? `incident:${incidentId}:escalated:no-responder`
          : `incident:${incidentId}:dispatch:${result.summary.assignedResponderId}`
      });
    }

    return result.summary;
  }

  async function resolveIncident(incidentId) {
    const result = await mutate((state) => {
      const incident = state.incidents.find((item) => item.id === incidentId);

      if (!incident) {
        throw new Error("Incident not found.");
      }

      incident.status = "resolved";
      incident.version = (incident.version ?? 1) + 1;
      incident.events.push(makeEvent("resolved", "Incident was marked resolved by the operator.", "ops"));

      const responder = state.responders.find((item) => item.id === incident.assignedResponderId);
      if (responder) {
        responder.availability = "available";
      }

      return incidentSummary(incident, state.responders);
    });

    await eventInfrastructure.appendEvent({
      incidentId,
      type: "incident.resolved",
      actor: "ops",
      payload: {
        status: result.status
      },
      idempotencyKey: `incident:${incidentId}:resolved`
    });

    return result;
  }

  async function getBootstrap() {
    const state = await readState();
    const incidents = await listIncidents();
    const activeIncidents = incidents.filter((incident) => incident.status !== "resolved");

    return {
      generatedAt: new Date().toISOString(),
      neighborhood: clone(state.neighborhood),
      incidentTypes: clone(INCIDENT_TYPES),
      responderTypes: clone(RESPONDER_TYPES),
      responders: await listResponders(),
      incidents,
      metrics: {
        activeIncidents: activeIncidents.length,
        availableResponders: state.responders.filter((item) => item.availability === "available").length,
        pendingTrustReviews: state.trustQueue.filter((item) => item.status === "pending").length
      }
    };
  }

  async function getDashboard() {
    const state = await readState();
    const incidents = await listIncidents();
    const activeIncidents = incidents.filter((incident) => incident.status !== "resolved");
    const criticalIncidents = activeIncidents.filter((incident) => incident.severity === "critical");

    return {
      generatedAt: new Date().toISOString(),
      neighborhood: clone(state.neighborhood),
      metrics: {
        totalIncidents: incidents.length,
        activeIncidents: activeIncidents.length,
        criticalIncidents: criticalIncidents.length,
        availableResponders: state.responders.filter((item) => item.availability === "available").length,
        engagedResponders: state.responders.filter((item) => item.availability === "engaged").length
      },
      responders: await listResponders(),
      incidents,
      trustQueue: clone(state.trustQueue),
      operatorQueue: clone(state.operatorQueue ?? []),
      presence: clone(state.presence ?? []),
      infrastructure: await eventInfrastructure.listQueueState()
    };
  }

  async function claimOperatorQueueItem(operatorRef = "operator") {
    return mutate((state) => {
      state.operatorQueue ??= [];
      const now = Date.now();
      const item = state.operatorQueue
        .filter((entry) => entry.status === "queued" || (entry.status === "locked" && new Date(entry.lockedUntil).getTime() <= now))
        .sort((left, right) => right.priority - left.priority || new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime())[0];

      if (!item) return null;

      item.status = "locked";
      item.ownerOperatorRef = operatorRef;
      item.lockedUntil = new Date(Date.now() + 5 * 60_000).toISOString();
      item.updatedAt = new Date().toISOString();

      return clone(item);
    });
  }

  async function releaseOperatorQueueItem(queueItemId, operatorRef = "operator") {
    return mutate((state) => {
      const item = (state.operatorQueue ?? []).find((entry) => entry.id === queueItemId);
      if (!item) throw new Error("Operator queue item not found.");
      if (item.ownerOperatorRef && item.ownerOperatorRef !== operatorRef) throw new Error("Queue item is owned by another operator.");

      item.status = "queued";
      item.ownerOperatorRef = null;
      item.lockedUntil = null;
      item.updatedAt = new Date().toISOString();

      return clone(item);
    });
  }

  async function reassignOperatorQueueItem(queueItemId, targetOperatorRef, supervisorRef = "supervisor") {
    return mutate((state) => {
      const item = (state.operatorQueue ?? []).find((entry) => entry.id === queueItemId);
      if (!item) throw new Error("Operator queue item not found.");

      item.status = "locked";
      item.ownerOperatorRef = targetOperatorRef;
      item.lockedUntil = new Date(Date.now() + 5 * 60_000).toISOString();
      item.reassignedBy = supervisorRef;
      item.updatedAt = new Date().toISOString();

      return clone(item);
    });
  }

  async function recordPresence({ actorRef = "operator", actorType = "operator", status = "online" } = {}) {
    return mutate((state) => {
      state.presence ??= [];
      const existing = state.presence.find((entry) => entry.actorRef === actorRef && entry.actorType === actorType);
      const record = {
        actorRef,
        actorType,
        status,
        lastSeenAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 45_000).toISOString()
      };

      if (existing) {
        Object.assign(existing, record);
        return clone(existing);
      }

      state.presence.push(record);
      return clone(record);
    });
  }

  async function recordTelecomReceipt(provider, payload) {
    return eventInfrastructure.recordReceipt({ provider, ...payload });
  }

  async function getIncidentReplay(incidentId) {
    return eventInfrastructure.reconstructIncidentTimeline(incidentId);
  }

  const otpSessions = new Map();
  const workProofs = new Map();

  async function setOtpSession(token, data) {
    otpSessions.set(token, clone(data));
  }

  async function getOtpSession(token) {
    const session = otpSessions.get(token);
    return session ? clone(session) : null;
  }

  async function updateOtpSession(token, data) {
    otpSessions.set(token, clone(data));
  }

  async function deleteOtpSession(token) {
    otpSessions.delete(token);
  }

  async function saveWorkProof(proof) {
    workProofs.set(proof.id, clone(proof));
    return clone(proof);
  }

  async function listWorkProofs(artisanId) {
    return [...workProofs.values()]
      .filter((proof) => proof.artisanId === artisanId)
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .map(clone);
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
    setOtpSession,
    getOtpSession,
    updateOtpSession,
    deleteOtpSession,
    saveWorkProof,
    listWorkProofs,
    eventInfrastructure,
    stateFile
  };
}
