import {
  formatRelativeTime,
  getIncidentType,
  getResponderType,
  getStatus
} from "/shared/domain.js";

const app = document.querySelector("#app");

const state = {
  bootstrap: null,
  message: null,
  error: null,
  selectedType: "medical",
  submitting: false
};

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error || "Request failed.");
  }

  return body;
}

function statusTag(status) {
  const descriptor = getStatus(status);
  return `<span class="tag status-${descriptor.id}">${descriptor.label}</span>`;
}

function responderCard(responder) {
  const type = getResponderType(responder.responderType);

  return `
    <article class="responder-card">
      <div class="responder-head">
        <div>
          <strong>${responder.fullName}</strong>
          <div class="microcopy">${type.label}</div>
        </div>
        <div class="tag">${responder.availability}</div>
      </div>
      <div class="responder-meta">
        <span class="tag">Trust ${responder.trustScore}</span>
        <span class="tag">${responder.territory}</span>
      </div>
    </article>
  `;
}

function incidentCard(incident) {
  return `
    <article class="incident-card">
      <div class="incident-head">
        <div>
          <strong>${incident.incidentTypeLabel}</strong>
          <div class="microcopy">${incident.locationNote}</div>
        </div>
        ${statusTag(incident.status)}
      </div>
      <div class="incident-meta">
        <span class="tag">${incident.severity}</span>
        <span class="tag">${formatRelativeTime(incident.createdAt)}</span>
        <span class="tag">${incident.assignedResponder ? `Assigned: ${incident.assignedResponder.fullName}` : "Waiting for assignment"}</span>
      </div>
    </article>
  `;
}

function render() {
  if (!state.bootstrap) {
    app.innerHTML = `<main class="shell"><section class="masthead"><h1>Loading pilot console...</h1></section></main>`;
    return;
  }

  const { neighborhood, metrics, responders, incidents, incidentTypes } = state.bootstrap;
  const recentIncidents = incidents.slice(0, 4);
  const activeResponders = responders.slice(0, 4);

  app.innerHTML = `
    <main class="shell">
      <section class="masthead">
        <div class="masthead-top">
          <div>
            <span class="eyebrow">Yaba emergency pilot</span>
            <h1>Trusted help, routed fast.</h1>
            <p>
              This prototype is built around one problem: a resident in the pilot zone must be able
              to raise a live alert quickly and reach verified nearby help with as little confusion as possible.
            </p>
          </div>
          <a class="ops-link" href="/ops">Open ops console</a>
        </div>
        <div class="pilot-status">
          <div class="signal-chip">
            <span>Coverage</span>
            <strong>${neighborhood.name}</strong>
          </div>
          <div class="signal-chip">
            <span>Mode</span>
            <strong>Human-operated pilot</strong>
          </div>
          <div class="signal-chip">
            <span>Boundary note</span>
            <strong>${neighborhood.coverageNote}</strong>
          </div>
        </div>
      </section>

      <section class="actions-grid">
        <article class="hero-callout">
          <div>
            <h2>Emergency signal</h2>
            <p>
              Use this for the pilot only. The operator console will route the alert to matched responders in the zone.
            </p>
          </div>
          <button class="danger-button" data-quick-fill="critical">Create high-urgency alert</button>
        </article>

        <article class="status-panel">
          <h3>Live pilot status</h3>
          <div class="stats-strip">
            <div class="stat-box">
              <span>Active incidents</span>
              <strong>${metrics.activeIncidents}</strong>
            </div>
            <div class="stat-box">
              <span>Available responders</span>
              <strong>${metrics.availableResponders}</strong>
            </div>
            <div class="stat-box">
              <span>Pending trust reviews</span>
              <strong>${metrics.pendingTrustReviews}</strong>
            </div>
          </div>
        </article>
      </section>

      <section class="dashboard-grid">
        <section class="panel panel-form">
          <h2>Raise an alert</h2>
          <p class="microcopy">
            The first release keeps the form tight. Choose the incident type, describe the landmark, and submit.
          </p>
          <form id="resident-alert-form">
            <div class="grid-two">
              <div class="field">
                <label for="requesterName">Your name</label>
                <input id="requesterName" name="requesterName" placeholder="Resident name" value="Pilot Resident" />
              </div>
              <div class="field">
                <label for="severity">Severity</label>
                <select id="severity" name="severity">
                  <option value="critical">Critical</option>
                  <option value="high" selected>High</option>
                  <option value="moderate">Moderate</option>
                </select>
              </div>
            </div>
            <div class="field">
              <label for="incidentType">Incident type</label>
              <select id="incidentType" name="incidentType">
                ${incidentTypes
                  .map((type) => {
                    const selected = type.id === state.selectedType ? "selected" : "";
                    return `<option value="${type.id}" ${selected}>${type.label}</option>`;
                  })
                  .join("")}
              </select>
            </div>
            <div class="field">
              <label for="locationNote">Location note</label>
              <textarea
                id="locationNote"
                name="locationNote"
                placeholder="Street, landmark, gate, floor, or anything a responder can act on quickly."
              >Near Tejuosho bus stop, by the pharmacy row.</textarea>
            </div>
            <div class="checkbox-row">
              <input id="sharePreciseLocation" name="sharePreciseLocation" type="checkbox" checked />
              <label for="sharePreciseLocation">Share precise location during this incident</label>
            </div>
            <div class="form-footer">
              <button class="primary-button" type="submit" ${state.submitting ? "disabled" : ""}>
                ${state.submitting ? "Sending..." : "Send live alert"}
              </button>
              <button class="ghost-button" data-refresh type="button">Refresh pilot data</button>
              <span class="hint">Target: alert creation in under 30 seconds.</span>
            </div>
            ${
              state.message
                ? `<div class="alert-message success">${state.message}</div>`
                : state.error
                  ? `<div class="alert-message error">${state.error}</div>`
                  : ""
            }
          </form>
        </section>

        <section class="panel panel-responders">
          <h3>Trusted responders nearby</h3>
          <div class="list">
            ${activeResponders.map(responderCard).join("")}
          </div>
        </section>

        <section class="panel panel-incidents">
          <h3>Recent incident stream</h3>
          <div class="list">
            ${recentIncidents.map(incidentCard).join("")}
          </div>
        </section>
      </section>
    </main>
  `;
}

async function loadBootstrap() {
  state.error = null;
  state.bootstrap = await requestJson("/api/bootstrap");
  render();
}

async function submitAlert(form) {
  const formData = new FormData(form);
  state.submitting = true;
  state.error = null;
  state.message = null;
  render();

  try {
    const result = await requestJson("/api/incidents", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        requesterName: formData.get("requesterName"),
        incidentType: formData.get("incidentType"),
        severity: formData.get("severity"),
        locationNote: formData.get("locationNote"),
        sharePreciseLocation: formData.get("sharePreciseLocation") === "on"
      })
    });

    const firstMatch = result.matchingResponders[0];
    state.message = firstMatch
      ? `Alert sent. First matched responder: ${firstMatch.fullName}.`
      : "Alert sent. No verified responder is immediately available, operator review required.";

    state.selectedType = formData.get("incidentType");
    await loadBootstrap();
  } catch (error) {
    state.error = error instanceof Error ? error.message : "Failed to send alert.";
    render();
  } finally {
    state.submitting = false;
    render();
  }
}

app.addEventListener("submit", async (event) => {
  if (!(event.target instanceof HTMLFormElement) || event.target.id !== "resident-alert-form") {
    return;
  }

  event.preventDefault();
  await submitAlert(event.target);
});

app.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  if (target.matches("[data-refresh]")) {
    await loadBootstrap();
  }

  if (target.matches("[data-quick-fill='critical']")) {
    const form = document.querySelector("#resident-alert-form");
    if (!(form instanceof HTMLFormElement)) {
      return;
    }

    form.severity.value = "critical";
    form.incidentType.value = "medical";
    form.locationNote.value = "Immediate danger near Tejuosho bus stop. One person requires urgent support.";
    form.requesterName.focus();
  }
});

loadBootstrap().catch((error) => {
  state.error = error instanceof Error ? error.message : "Failed to load pilot data.";
  render();
});
