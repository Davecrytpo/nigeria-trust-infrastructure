import {
  formatRelativeTime,
  getIncidentType,
  getResponderType,
  getStatus
} from "/shared/domain.js";

const app = document.querySelector("#app");

const state = {
  dashboard: null,
  error: null,
  opsKey: window.localStorage.getItem("opsAccessKey") ?? "",
  operatorRef: window.localStorage.getItem("operatorRef") ?? "browser-operator",
  events: null,
  presenceTimer: null,
  loading: false,
  filter: "active",
  selectedIncidentId: null,
  replayEvents: [],
  acknowledgedTrustIds: new Set(),
  escalations: new Set(),
  supervisorOverrides: new Set(),
  auditFeed: [],
  mapOverlay: "incidents",
  presentationMode: false,
  focusMode: true,
  syncState: "connecting",
  staleSnapshotsIgnored: 0,
  lastSnapshotAt: null,
  sseReconnects: 0
};

const focusLimit = (items, limit) => state.focusMode ? items.slice(0, limit) : items;

const cssEscape = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

async function requestJson(url, options = {}, requireOpsKey = false) {
  const headers = new Headers(options.headers ?? {});

  if (requireOpsKey && state.opsKey) {
    headers.set("x-ops-key", state.opsKey);
  }

  const response = await fetch(url, {
    ...options,
    headers
  });
  const body = await response.json();

  if (!response.ok) {
    const error = new Error(body.error || "Request failed.");
    error.code = body.code || "REQUEST_FAILED";
    throw error;
  }

  return body;
}

function renderIncidentRow(incident) {
  const type = getIncidentType(incident.incidentType);
  const status = getStatus(incident.status);
  const severity = String(incident.severity ?? "high").toLowerCase();

  return `
    <article class="table-row ${state.selectedIncidentId === incident.id ? "selected" : ""}">
      <div>
        <strong>${cssEscape(type.label)}</strong>
        <div class="subtle">${cssEscape(incident.locationNote)}</div>
        <div class="chips">
          <span class="chip ${cssEscape(status.id)}">${cssEscape(status.label)}</span>
          <span class="chip severity-${cssEscape(severity)}">${cssEscape(incident.severity)}</span>
          <span class="chip">${cssEscape(formatRelativeTime(incident.createdAt))}</span>
        </div>
      </div>
      <div>
        <strong>Requester</strong>
        <div class="subtle">${cssEscape(incident.requesterName)}</div>
      </div>
      <div>
        <strong>Assigned</strong>
        <div class="subtle">${cssEscape(incident.assignedResponder ? incident.assignedResponder.fullName : "Unassigned")}</div>
      </div>
      <div class="table-actions">
        <button class="table-button" data-select-incident="${cssEscape(incident.id)}">Open</button>
        <button class="table-button accent" data-dispatch="${cssEscape(incident.id)}">Dispatch</button>
        <button class="table-button" data-resolve="${cssEscape(incident.id)}">Resolve</button>
        <button class="table-button danger" data-escalate="${cssEscape(incident.id)}">Escalate</button>
      </div>
    </article>
  `;
}

function renderResponderRow(responder) {
  const type = getResponderType(responder.responderType);

  return `
    <article class="responder-row">
      <div>
        <strong>${cssEscape(responder.fullName)}</strong>
        <div class="subtle">${cssEscape(type.label)}</div>
      </div>
      <div class="chips">
        <span class="chip">${cssEscape(responder.availability)}</span>
        <span class="chip">Trust ${cssEscape(responder.trustScore)}</span>
      </div>
    </article>
  `;
}

function renderTrustRow(entry) {
  const type = getResponderType(entry.responderType);
  const id = entry.id ?? entry.fullName;
  const acknowledged = state.acknowledgedTrustIds.has(id);

  return `
    <article class="trust-row">
      <div>
        <strong>${cssEscape(entry.fullName)}</strong>
        <div class="subtle">${cssEscape(type.label)}</div>
      </div>
      <div class="chips">
        <span class="chip">${acknowledged ? "operator-reviewed" : cssEscape(entry.status)}</span>
        <span class="chip">${cssEscape(formatRelativeTime(entry.submittedAt))}</span>
        <button class="table-button" data-ack-trust="${cssEscape(id)}">Review</button>
      </div>
    </article>
  `;
}

function renderOperatorQueueRow(entry) {
  const id = entry.id ?? entry.queueId ?? entry.incidentId ?? entry.incident_id;
  return `
    <article class="trust-row">
      <div>
        <strong>${cssEscape(entry.incidentId ?? entry.incident_id)}</strong>
        <div class="subtle">${cssEscape(entry.queueName ?? entry.queue_name ?? "yaba-primary")} - priority ${cssEscape(entry.priority)}</div>
      </div>
      <div class="chips">
        <span class="chip">${cssEscape(entry.status)}</span>
        <span class="chip">${cssEscape(entry.ownerOperatorRef ?? entry.owner_operator_ref ?? "unowned")}</span>
        <button class="table-button" data-release-queue="${cssEscape(id)}">Release</button>
      </div>
    </article>
  `;
}

function renderPresenceRow(entry) {
  return `
    <article class="trust-row">
      <div>
        <strong>${cssEscape(entry.actorRef ?? entry.actor_ref)}</strong>
        <div class="subtle">${cssEscape(entry.actorType ?? entry.actor_type)}</div>
      </div>
      <div class="chips">
        <span class="chip">${cssEscape(entry.status)}</span>
        <span class="chip">${cssEscape(formatRelativeTime(entry.lastSeenAt ?? entry.last_seen_at))}</span>
      </div>
    </article>
  `;
}

function renderMapIncident(incident, index) {
  const type = getIncidentType(incident.incidentType);
  const status = getStatus(incident.status);
  const left = 18 + ((index * 23) % 62);
  const top = 22 + ((index * 17) % 52);

  return `
    <button class="map-pin ${cssEscape(status.id)}" style="left: ${left}%; top: ${top}%;" title="${cssEscape(type.label)}" data-select-incident="${cssEscape(incident.id)}">
      <span>${index + 1}</span>
    </button>
  `;
}

function renderResponderMarker(responder, index) {
  const left = 12 + ((index * 19) % 70);
  const top = 18 + ((index * 29) % 58);
  const type = getResponderType(responder.responderType);

  return `
    <button class="responder-pin" style="left: ${left}%; top: ${top}%;" title="${cssEscape(responder.fullName)}">
      <span>${cssEscape(type.label.slice(0, 1))}</span>
    </button>
  `;
}

function renderIncidentClusters(incidents) {
  if (!incidents.length) return "";
  const groups = incidents.reduce((acc, incident) => {
    const key = getIncidentType(incident.incidentType).label;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(groups).map(([label, count], index) => {
    const left = 16 + ((index * 31) % 64);
    const top = 18 + ((index * 21) % 60);
    return `
      <div class="cluster-pin" style="left: ${left}%; top: ${top}%;">
        <strong>${count}</strong>
        <span>${cssEscape(label)}</span>
      </div>
    `;
  }).join("");
}

function renderCommandMap(incidents, responders, activeDisasterMode, infrastructure) {
  const telecomOutage = (infrastructure.failed ?? 0) > 0 || (infrastructure.retrying ?? 0) > 0;
  return `
    <div class="map-toolbar">
      <button class="filter-button ${state.mapOverlay === "incidents" ? "active" : ""}" data-map-overlay="incidents">Incidents</button>
      <button class="filter-button ${state.mapOverlay === "responders" ? "active" : ""}" data-map-overlay="responders">Responders</button>
      <button class="filter-button ${state.mapOverlay === "clusters" ? "active" : ""}" data-map-overlay="clusters">Clusters</button>
      <button class="filter-button ${state.mapOverlay === "disaster" ? "active" : ""}" data-map-overlay="disaster">Disaster</button>
    </div>
    <div class="incident-map ${activeDisasterMode ? "disaster-overlay" : ""} ${telecomOutage ? "telecom-outage" : ""}">
      <div class="map-road road-a"></div>
      <div class="map-road road-b"></div>
      <div class="map-road road-c"></div>
      ${state.mapOverlay === "incidents" ? incidents.slice(0, state.focusMode ? 8 : 12).map(renderMapIncident).join("") : ""}
      ${state.mapOverlay === "responders" ? responders.slice(0, state.focusMode ? 8 : 12).map(renderResponderMarker).join("") : ""}
      ${state.mapOverlay === "clusters" ? renderIncidentClusters(incidents) : ""}
      ${state.mapOverlay === "disaster" ? `<div class="disaster-band">Disaster coordination overlay active</div>` : ""}
      ${telecomOutage ? `<div class="telecom-band">Telecom degradation visible</div>` : ""}
    </div>
  `;
}

function filterIncidents(incidents) {
  if (state.filter === "all") return incidents;
  if (state.filter === "critical") return incidents.filter((incident) => String(incident.severity).toLowerCase() === "critical");
  if (state.filter === "unassigned") return incidents.filter((incident) => !incident.assignedResponder);
  if (state.filter === "escalated") return incidents.filter((incident) => state.escalations.has(incident.id));
  return incidents.filter((incident) => getStatus(incident.status).id !== "resolved");
}

function renderFilters() {
  const filters = [
    ["active", "Active"],
    ["critical", "Critical"],
    ["unassigned", "Unassigned"],
    ["escalated", "Escalated"],
    ["all", "All"]
  ];

  return `
    <div class="filter-row" role="tablist" aria-label="Incident filters">
      ${filters.map(([id, label]) => `
        <button class="filter-button ${state.filter === id ? "active" : ""}" data-filter="${id}" role="tab" aria-selected="${state.filter === id}">
          ${label}
        </button>
      `).join("")}
    </div>
  `;
}

function renderSelectedIncident(incidents) {
  const selected = incidents.find((incident) => incident.id === state.selectedIncidentId) ?? incidents[0];
  if (!selected) {
    return `<div class="empty">Select an incident to inspect dispatch, escalation, and replay state.</div>`;
  }

  const type = getIncidentType(selected.incidentType);
  const status = getStatus(selected.status);
  const escalated = state.escalations.has(selected.id);
  const override = state.supervisorOverrides.has(selected.id);

  return `
    <article class="detail-card">
      <div class="panel-header">
        <div>
          <span class="panel-kicker">Incident detail</span>
          <h3>${cssEscape(type.label)} - ${cssEscape(selected.id)}</h3>
        </div>
        <span class="state-chip ${escalated || override ? "alert" : ""}">${override ? "Supervisor override" : escalated ? "Escalated" : cssEscape(status.label)}</span>
      </div>
      <p>${cssEscape(selected.locationNote)}</p>
      <div class="detail-grid">
        <span><strong>Requester</strong>${cssEscape(selected.requesterName)}</span>
        <span><strong>Responder</strong>${cssEscape(selected.assignedResponder?.fullName ?? "Unassigned")}</span>
        <span><strong>Severity</strong>${cssEscape(selected.severity)}</span>
        <span><strong>Created</strong>${cssEscape(formatRelativeTime(selected.createdAt))}</span>
      </div>
      <div class="action-row">
        <button class="primary-button" data-dispatch="${cssEscape(selected.id)}">Dispatch responder</button>
        <button class="secondary-button" data-load-replay="${cssEscape(selected.id)}">Load replay</button>
        <button class="secondary-button" data-escalate="${cssEscape(selected.id)}">Escalate</button>
        <button class="secondary-button" data-supervisor-override="${cssEscape(selected.id)}">Supervisor override</button>
        <button class="secondary-button" data-resolve="${cssEscape(selected.id)}">Resolve</button>
      </div>
    </article>
  `;
}

function addAudit(action, detail = {}) {
  state.auditFeed.unshift({
    action,
    detail,
    operatorRef: state.operatorRef,
    at: new Date().toISOString()
  });
  state.auditFeed = state.auditFeed.slice(0, 40);
}

function renderAuditFeed() {
  if (!state.auditFeed.length) {
    return `<div class="empty">Operator actions will appear here during this console session.</div>`;
  }

  return state.auditFeed.map((entry) => `
    <article class="timeline-row">
      <span class="timeline-dot">A</span>
      <div>
        <strong>${cssEscape(entry.action)}</strong>
        <div class="subtle">${cssEscape(entry.operatorRef)} - ${cssEscape(formatRelativeTime(entry.at))}</div>
        <pre>${cssEscape(JSON.stringify(entry.detail, null, 2))}</pre>
      </div>
    </article>
  `).join("");
}

function renderPilotDemoStrip() {
  if (!state.presentationMode) return "";

  return `
    <section class="demo-strip" aria-label="Pilot demonstration controls">
      <div>
        <span class="panel-kicker">Pilot presentation</span>
        <strong>Guided command walkthrough</strong>
        <p>Show incident intake, responder assignment, telecom fallback, degraded mode, and replay without overloading the room.</p>
      </div>
      <div class="action-row">
        <button class="secondary-button" data-map-overlay="clusters">Show clusters</button>
        <button class="secondary-button" data-filter="critical">Focus critical</button>
        <button class="secondary-button" data-simulate-degraded>Show degraded mode</button>
        <button class="secondary-button" data-toggle-presentation>Hide guide</button>
      </div>
    </section>
  `;
}

function renderSyncConfidenceStrip(generatedAt) {
  const tone = state.syncState === "live" ? "good" : state.syncState === "reconnecting" ? "warn" : "offline";
  const label = state.syncState === "live" ? "Live sync stable" : state.syncState === "reconnecting" ? "Reconnecting safely" : "Sync initializing";
  return `
    <section class="sync-strip ${tone}" aria-label="Synchronization status">
      <span>${label}</span>
      <strong>${cssEscape(formatRelativeTime(generatedAt))}</strong>
      <span>${cssEscape(state.staleSnapshotsIgnored)} stale snapshots ignored</span>
      <span>${cssEscape(state.sseReconnects)} reconnects</span>
    </section>
  `;
}

function renderTelecomHealth(infrastructure = {}) {
  const queued = infrastructure.queued ?? 0;
  const delivered = infrastructure.delivered ?? infrastructure.synced ?? 0;
  const failed = infrastructure.failed ?? 0;
  const providers = infrastructure.providers ?? [
    { name: "Primary SMS", status: queued > 0 ? "queued" : "available", latencyMs: 870 },
    { name: "Fallback SMS", status: failed > 0 ? "watch" : "available", latencyMs: 1120 },
    { name: "Data sync", status: "degraded-ready", latencyMs: 420 }
  ];

  return providers.map((provider) => `
    <article class="health-row">
      <div>
        <strong>${cssEscape(provider.name)}</strong>
        <div class="subtle">${cssEscape(provider.latencyMs ?? "n/a")}ms observed latency</div>
      </div>
      <span class="health ${cssEscape(provider.status)}">${cssEscape(provider.status)}</span>
    </article>
  `).join("") + `
    <div class="health-summary">
      <span>Queued ${cssEscape(queued)}</span>
      <span>Delivered ${cssEscape(delivered)}</span>
      <span>Failed ${cssEscape(failed)}</span>
    </div>
  `;
}

function renderAuditTimeline(incidents = [], operatorQueue = []) {
  const events = [
    ...incidents.slice(0, 4).map((incident) => ({
      label: `${getIncidentType(incident.incidentType).label} incident ${getStatus(incident.status).label}`,
      time: incident.updatedAt ?? incident.createdAt
    })),
    ...operatorQueue.slice(0, 3).map((entry) => ({
      label: `Queue ${entry.status} for ${entry.incidentId ?? entry.incident_id}`,
      time: entry.updatedAt ?? entry.createdAt ?? entry.claimedAt
    }))
  ];

  if (!events.length) {
    return `<div class="empty">No replay events available.</div>`;
  }

  return events.map((event, index) => `
    <article class="timeline-row">
      <span class="timeline-dot">${index + 1}</span>
      <div>
        <strong>${cssEscape(event.label)}</strong>
        <div class="subtle">${cssEscape(formatRelativeTime(event.time))}</div>
      </div>
    </article>
  `).join("");
}

function renderLoadedReplay() {
  if (!state.replayEvents.length) {
    return `<div class="empty">Load an incident replay to inspect stored event order and duplicate suppression.</div>`;
  }

  return state.replayEvents.map((event, index) => `
    <article class="timeline-row">
      <span class="timeline-dot">${index + 1}</span>
      <div>
        <strong>${cssEscape(event.type ?? event.eventType ?? "event")}</strong>
        <div class="subtle">${cssEscape(formatRelativeTime(event.createdAt ?? event.timestamp ?? event.at))}</div>
        <pre>${cssEscape(JSON.stringify(event.payload ?? event, null, 2))}</pre>
      </div>
    </article>
  `).join("");
}

function renderAccessForm() {
  app.innerHTML = `
    <main class="shell">
      <section class="banner">
        <div>
          <span class="badge">Operator access required</span>
          <h1>Enter the local ops access key.</h1>
          <p>
            The operator board is now gated. Use the configured <code>OPS_ACCESS_KEY</code> value for this machine.
          </p>
        </div>
        <form id="ops-access-form" class="access-form">
          <label class="field">
            <span>Ops access key</span>
            <input id="opsKey" name="opsKey" type="password" autocomplete="current-password" placeholder="Enter access key" />
          </label>
          <div class="action-row">
            <button class="primary-button" type="submit">Unlock ops console</button>
          </div>
          ${state.error ? `<div class="error-banner">${state.error}</div>` : ""}
        </form>
      </section>
    </main>
  `;
}

function renderLoading() {
  app.innerHTML = `
    <main class="shell">
      <section class="banner loading-state">
        <span class="badge">Live command center</span>
        <h1>${state.loading ? "Preparing command view." : "Command view ready."}</h1>
        ${state.error ? `<div class="error-banner">${state.error}</div>` : "<p>Loading incidents, responders, telecom health, and operator presence.</p>"}
        <div class="skeleton-grid">
          <span></span><span></span><span></span>
        </div>
      </section>
    </main>
  `;
}

function renderDashboard() {
  const { metrics, incidents, responders, trustQueue, operatorQueue = [], presence = [], infrastructure = {}, neighborhood, generatedAt } = state.dashboard;
  const activeDisasterMode = infrastructure.disasterMode ?? metrics.criticalIncidents > 1;
  const visibleIncidents = filterIncidents(incidents);
  const displayIncidents = focusLimit(visibleIncidents, 6);
  const displayResponders = focusLimit(responders, 5);
  const displayTrustQueue = focusLimit(trustQueue, 4);
  const displayOperatorQueue = focusLimit(operatorQueue, 5);
  const displayPresence = focusLimit(presence, 4);
  const focusedStats = state.focusMode
    ? [
        ["Active incidents", metrics.activeIncidents, ""],
        ["Critical incidents", metrics.criticalIncidents, "critical"],
        ["Available responders", metrics.availableResponders, ""],
        ["Delivery queued", infrastructure.queued ?? 0, ""]
      ]
    : [
        ["Total incidents", metrics.totalIncidents, ""],
        ["Active incidents", metrics.activeIncidents, ""],
        ["Critical incidents", metrics.criticalIncidents, "critical"],
        ["Available responders", metrics.availableResponders, ""],
        ["Engaged responders", metrics.engagedResponders, ""],
        ["Delivery queued", infrastructure.queued ?? 0, ""],
        ["Live presence", presence.length, ""]
      ];

  app.innerHTML = `
    <main class="ops-layout">
      <aside class="sidebar" aria-label="Operator navigation">
        <div class="brand-mark">NT</div>
        <strong>Trust Ops</strong>
        <nav>
          <a href="#command">Command</a>
          <a href="#queue">Queue</a>
          <a href="#map">Incident map</a>
          <a href="#telecom">Telecom</a>
          <a href="#audit">Audit replay</a>
        </nav>
      </aside>

      <section class="shell" id="command">
        <section class="banner">
          <div class="banner-top">
            <div>
              <span class="badge">Live command center</span>
              <h1>Yaba response coordination.</h1>
              <p>
                Focus on the next safe action: understand location, confirm responder capacity, and preserve telecom fallback.
              </p>
            </div>
            <div class="action-row">
              <button class="primary-button" data-refresh>Refresh board</button>
              <button class="secondary-button" data-claim-queue>Claim next</button>
              <button class="secondary-button" data-toggle-focus>${state.focusMode ? "Full board" : "Focus mode"}</button>
              <button class="secondary-button" data-toggle-presentation>${state.presentationMode ? "Hide guide" : "Demo guide"}</button>
              <button class="secondary-button" data-simulate-degraded>Mark degraded mode</button>
              <button class="secondary-button" data-logout>Clear access key</button>
            </div>
          </div>
          <div class="meta-row">
            ${cssEscape(neighborhood.name)} - generated ${cssEscape(formatRelativeTime(generatedAt))} - ${cssEscape(neighborhood.coverageNote)} - SSE reconnects ${cssEscape(state.sseReconnects)}
          </div>
          ${state.error ? `<div class="error-banner">${cssEscape(state.error)}</div>` : ""}
        </section>

        ${renderPilotDemoStrip()}
        ${renderSyncConfidenceStrip(generatedAt)}

        <section class="grid stats" aria-label="Operational metrics">
          ${focusedStats.map(([label, value, className]) => `
            <article class="stat-card ${className}">
              <span>${cssEscape(label)}</span>
              <strong>${cssEscape(value)}</strong>
            </article>
          `).join("")}
        </section>

        <section class="grid ${state.focusMode ? "focus-grid" : ""}">
          <section class="panel wide" id="queue">
            <div class="panel-header">
              <div>
                <span class="panel-kicker">Next actions</span>
                <h2>Incident queue</h2>
              </div>
              <span class="state-chip">${cssEscape(displayIncidents.length)} of ${cssEscape(visibleIncidents.length)}</span>
            </div>
            ${renderFilters()}
            <div class="table-list priority-list">
              ${displayIncidents.length ? displayIncidents.map(renderIncidentRow).join("") : `<div class="empty">No incidents match this filter.</div>`}
            </div>
          </section>

          <section class="panel narrow" id="map">
            <div class="panel-header">
              <div>
                <span class="panel-kicker">Coordination map</span>
                <h3>Live command map</h3>
              </div>
              <span class="state-chip">${cssEscape(state.mapOverlay)}</span>
            </div>
            ${renderCommandMap(displayIncidents, displayResponders, activeDisasterMode, infrastructure)}
          </section>

          <section class="panel narrow">
            ${renderSelectedIncident(incidents)}
          </section>

          <section class="panel narrow">
            <div class="panel-header">
              <div>
                <span class="panel-kicker">Responder tracking</span>
                <h3>Responder network</h3>
              </div>
            </div>
            <div class="table-list">${displayResponders.map(renderResponderRow).join("")}</div>
          </section>

          ${state.focusMode ? "" : `
          <section class="panel narrow">
            <div class="panel-header">
              <div>
                <span class="panel-kicker">Trust review</span>
                <h3>Verification queue</h3>
              </div>
            </div>
            <div class="table-list">
              ${displayTrustQueue.length ? displayTrustQueue.map(renderTrustRow).join("") : `<div class="empty">Trust queue is clear.</div>`}
            </div>
          </section>
          `}

          <section class="panel narrow" id="telecom">
            <div class="panel-header">
              <div>
                <span class="panel-kicker">Fallback health</span>
                <h3>Delivery channels</h3>
              </div>
            </div>
            <div class="table-list">${renderTelecomHealth(infrastructure)}</div>
            <div class="outage-strip ${(infrastructure.failed ?? 0) > 0 ? "active" : ""}">
              ${(infrastructure.failed ?? 0) > 0 ? "Telecom outage or receipt failure requires fallback routing." : "No live telecom outage reported by current snapshot."}
            </div>
          </section>

          ${state.focusMode ? "" : `
          <section class="panel narrow">
            <div class="panel-header">
              <div>
                <span class="panel-kicker">Surge posture</span>
                <h3>Coordination view</h3>
              </div>
              <span class="state-chip ${activeDisasterMode ? "alert" : ""}">${activeDisasterMode ? "Armed" : "Standby"}</span>
            </div>
            <div class="coordination-grid">
              <article><strong>${cssEscape(metrics.criticalIncidents)}</strong><span>Critical load</span></article>
              <article><strong>${cssEscape(responders.length)}</strong><span>Responders known</span></article>
              <article><strong>${cssEscape(presence.length)}</strong><span>Operators online</span></article>
              <article><strong>${cssEscape(infrastructure.queued ?? 0)}</strong><span>Messages queued</span></article>
            </div>
            <div class="action-row compact">
              <button class="table-button accent" data-filter="critical">Focus critical</button>
              <button class="table-button" data-claim-queue>Claim surge item</button>
            </div>
          </section>

          <section class="panel narrow">
            <div class="panel-header">
              <div>
                <span class="panel-kicker">Presence</span>
                <h3>Live operators</h3>
              </div>
            </div>
            <div class="table-list">
              ${displayPresence.length ? displayPresence.map(renderPresenceRow).join("") : `<div class="empty">No active operator presence.</div>`}
            </div>
          </section>
          `}

          <section class="panel wide" id="audit">
            <div class="panel-header">
              <div>
                <span class="panel-kicker">Replay</span>
                <h2>Incident timeline</h2>
              </div>
            </div>
            <div class="timeline-list">${renderLoadedReplay()}</div>
            <div class="timeline-list secondary-timeline">${renderAuditTimeline(displayIncidents, displayOperatorQueue)}</div>
          </section>

          ${state.focusMode ? "" : `
          <section class="panel wide">
            <div class="panel-header">
              <div>
                <span class="panel-kicker">Operator confidence</span>
                <h2>Action feed</h2>
              </div>
              <span class="state-chip">${cssEscape(state.auditFeed.length)} actions</span>
            </div>
            <div class="timeline-list">${renderAuditFeed()}</div>
          </section>

          <section class="panel wide">
            <div class="panel-header">
              <div>
                <span class="panel-kicker">Operator queue actions</span>
                <h2>Claimed and pending work</h2>
              </div>
            </div>
            <div class="table-list">
              ${displayOperatorQueue.length ? displayOperatorQueue.map(renderOperatorQueueRow).join("") : `<div class="empty">Operator queue is clear.</div>`}
            </div>
          </section>
          `}
        </section>
      </section>
    </main>
  `;
}

function render() {
  if (!state.opsKey) {
    renderAccessForm();
    return;
  }

  if (!state.dashboard) {
    renderLoading();
    return;
  }

  renderDashboard();
}

async function loadDashboard() {
  state.error = null;
  state.loading = true;
  render();

  try {
    state.dashboard = await requestJson("/api/ops/dashboard", {}, true);
    state.syncState = state.events ? state.syncState : "live";
  } catch (error) {
    if (error instanceof Error && error.code === "OPS_AUTH_REQUIRED") {
      state.opsKey = "";
      state.dashboard = null;
      window.localStorage.removeItem("opsAccessKey");
    }

    throw error;
  } finally {
    state.loading = false;
  }

  render();
  startLiveSync();
}

async function postAction(url) {
  addAudit("backend action", { url });
  await requestJson(url, { method: "POST" }, true);
  await loadDashboard();
}

async function claimNextQueueItem() {
  addAudit("queue claim requested", { operatorRef: state.operatorRef });
  await requestJson("/api/ops/queue/claim", {
    method: "POST",
    headers: {
      "x-operator-ref": state.operatorRef
    }
  }, true);
  await loadDashboard();
}

async function releaseQueueItem(queueId) {
  addAudit("queue release requested", { queueId });
  await requestJson(`/api/ops/queue/${encodeURIComponent(queueId)}/release`, {
    method: "POST",
    headers: {
      "x-operator-ref": state.operatorRef
    }
  }, true);
  await loadDashboard();
}

async function loadReplay(incidentId) {
  addAudit("incident replay loaded", { incidentId });
  const body = await requestJson(`/api/incidents/${encodeURIComponent(incidentId)}/replay`, {}, true);
  state.selectedIncidentId = incidentId;
  state.replayEvents = body.events ?? [];
  render();
}

async function sendPresence() {
  if (!state.opsKey) {
    return;
  }

  await requestJson("/api/ops/presence", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-operator-ref": state.operatorRef
    },
    body: JSON.stringify({
      actorType: "operator",
      status: "online"
    })
  }, true);
}

function stopLiveSync() {
  if (state.events) {
    state.events.close();
    state.events = null;
  }

  if (state.presenceTimer) {
    clearInterval(state.presenceTimer);
    state.presenceTimer = null;
  }
}

function applyLiveDashboardRefresh() {
  loadDashboard().catch(() => {});
}

function startLiveSync() {
  if (!state.opsKey || state.events) {
    return;
  }

  const params = new URLSearchParams({
    opsKey: state.opsKey,
    operatorRef: state.operatorRef
  });
  const events = new EventSource(`/api/ops/events?${params.toString()}`);
  state.events = events;

  events.addEventListener("dashboard.snapshot", (event) => {
    const snapshot = JSON.parse(event.data);
    const snapshotAt = snapshot.generatedAt ? Date.parse(snapshot.generatedAt) : Date.now();
    if (state.lastSnapshotAt && snapshotAt < state.lastSnapshotAt) {
      state.staleSnapshotsIgnored += 1;
      return;
    }
    state.lastSnapshotAt = snapshotAt;
    state.syncState = "live";
    state.dashboard = snapshot;
    state.error = null;
    render();
  });

  [
    "incident.created",
    "incident.dispatched",
    "incident.resolved",
    "operator.queue.claimed",
    "operator.queue.released",
    "operator.queue.reassigned",
    "presence.updated",
    "telecom.receipt"
  ].forEach((eventName) => {
    events.addEventListener(eventName, applyLiveDashboardRefresh);
  });

  events.addEventListener("error", () => {
    state.sseReconnects += 1;
    state.syncState = "reconnecting";
    state.error = "Live sync disconnected. Retrying automatically.";
    stopLiveSync();
    render();
    window.setTimeout(() => {
      startLiveSync();
    }, Math.min(30000, 1000 * state.sseReconnects));
  });

  sendPresence().catch(() => {});
  state.presenceTimer = setInterval(() => {
    sendPresence().catch(() => {});
  }, 20_000);
}

app.addEventListener("submit", async (event) => {
  if (!(event.target instanceof HTMLFormElement) || event.target.id !== "ops-access-form") {
    return;
  }

  event.preventDefault();
  const formData = new FormData(event.target);
  const opsKey = String(formData.get("opsKey") ?? "").trim();

  if (!opsKey) {
    state.error = "Enter the access key before continuing.";
    render();
    return;
  }

  state.opsKey = opsKey;
  window.localStorage.setItem("opsAccessKey", opsKey);

  try {
    await loadDashboard();
  } catch (error) {
    state.error = error instanceof Error ? error.message : "Failed to unlock ops console.";
    render();
  }
});

app.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  try {
    if (target.matches("[data-refresh]")) {
      await loadDashboard();
      return;
    }

    if (target.matches("[data-logout]")) {
      stopLiveSync();
      state.opsKey = "";
      state.dashboard = null;
      state.error = null;
      window.localStorage.removeItem("opsAccessKey");
      render();
      return;
    }

    if (target.matches("[data-claim-queue]")) {
      await claimNextQueueItem();
      return;
    }

    const filter = target.getAttribute("data-filter");
    if (filter) {
      state.filter = filter;
      addAudit("incident filter changed", { filter });
      render();
      return;
    }

    const mapOverlay = target.getAttribute("data-map-overlay");
    if (mapOverlay) {
      state.mapOverlay = mapOverlay;
      addAudit("map overlay changed", { mapOverlay });
      render();
      return;
    }

    const selectedIncidentId = target.getAttribute("data-select-incident");
    if (selectedIncidentId) {
      state.selectedIncidentId = selectedIncidentId;
      addAudit("incident selected", { incidentId: selectedIncidentId });
      render();
      return;
    }

    const replayIncidentId = target.getAttribute("data-load-replay");
    if (replayIncidentId) {
      await loadReplay(replayIncidentId);
      return;
    }

    const releaseQueueId = target.getAttribute("data-release-queue");
    if (releaseQueueId) {
      await releaseQueueItem(releaseQueueId);
      return;
    }

    const trustId = target.getAttribute("data-ack-trust");
    if (trustId) {
      state.acknowledgedTrustIds.add(trustId);
      addAudit("trust review acknowledged", { trustId });
      render();
      return;
    }

    const escalateId = target.getAttribute("data-escalate");
    if (escalateId) {
      state.escalations.add(escalateId);
      state.selectedIncidentId = escalateId;
      addAudit("incident escalated", { incidentId: escalateId });
      render();
      return;
    }

    const overrideId = target.getAttribute("data-supervisor-override");
    if (overrideId) {
      state.supervisorOverrides.add(overrideId);
      state.selectedIncidentId = overrideId;
      addAudit("supervisor override marked", { incidentId: overrideId });
      render();
      return;
    }

    if (target.matches("[data-simulate-degraded]")) {
      state.error = "Degraded-mode visibility active: operators should prefer SMS, local dispatch confirmation, and manual replay checks.";
      addAudit("degraded mode visibility marked", {});
      render();
      return;
    }

    if (target.matches("[data-toggle-presentation]")) {
      state.presentationMode = !state.presentationMode;
      addAudit("presentation guide toggled", { enabled: state.presentationMode });
      render();
      return;
    }

    if (target.matches("[data-toggle-focus]")) {
      state.focusMode = !state.focusMode;
      addAudit("operator focus mode toggled", { enabled: state.focusMode });
      render();
      return;
    }

    const dispatchId = target.getAttribute("data-dispatch");
    if (dispatchId) {
      await postAction(`/api/incidents/${dispatchId}/dispatch`);
      return;
    }

    const resolveId = target.getAttribute("data-resolve");
    if (resolveId) {
      await postAction(`/api/incidents/${resolveId}/resolve`);
    }
  } catch (error) {
    state.error = error instanceof Error ? error.message : "Operator action failed.";
    render();
  }
});

if (state.opsKey) {
  loadDashboard().catch((error) => {
    state.error = error instanceof Error ? error.message : "Failed to load dashboard.";
    render();
  });
} else {
  render();
}

setInterval(() => {
  if (!state.opsKey) {
    return;
  }

  loadDashboard().catch(() => {});
}, 15000);
