import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { methodNotAllowed, notFound, parseJsonBody, securityHeaders, sendJson, sendText } from "./lib/http.js";
import { createOperatorSession, readOperatorSession, readOpsAccessKey, requestHasOpsAccess, requireOpsAccess, requireRole, revokeOperatorSession, rotateOperatorSession } from "./lib/auth.js";
import { createStore } from "./lib/store.js";
import { normalizeReceipt } from "./lib/telecom-providers.js";
import { createRateLimiter } from "./lib/rate-limit.js";
import { verifyWebhookSignature } from "./lib/webhook-signatures.js";
import { createPilotControls } from "./lib/pilot-controls.js";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = resolve(currentFile, "..");
const projectRoot = resolve(currentDir, "../../..");
const residentRoot = resolve(projectRoot, "apps", "resident-pwa");
const opsRoot = resolve(projectRoot, "apps", "ops-console");
const sharedRoot = resolve(projectRoot, "packages", "shared-types", "src");

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json; charset=utf-8"
};

function safeJoin(baseDirectory, requestedPath) {
  const normalized = normalize(requestedPath).replace(/^([/\\])+/, "");
  const absolutePath = resolve(baseDirectory, normalized);

  if (!absolutePath.startsWith(baseDirectory)) {
    throw new Error("Invalid path.");
  }

  return absolutePath;
}

async function serveFile(response, baseDirectory, requestedPath) {
  const filePath = safeJoin(baseDirectory, requestedPath);
  const body = await readFile(filePath);
  const extension = extname(filePath);
  const contentType = MIME_TYPES[extension] ?? "application/octet-stream";
  sendText(response, 200, body, contentType);
}

function readRoutePath(pathname, prefix) {
  const sliced = pathname.slice(prefix.length);
  return sliced.startsWith("/") ? sliced.slice(1) : sliced;
}

function writeSse(response, event, data, id = Date.now().toString()) {
  response.write(`id: ${id}\n`);
  response.write(`event: ${event}\n`);
  response.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function createAppServer(options = {}) {
  const store = options.store ?? createStore();
  const opsAccessKey = options.opsAccessKey ?? readOpsAccessKey();
  const rateLimiter = options.rateLimiter ?? createRateLimiter(options.rateLimit);
  const webhookSignatureRequired = options.webhookSignatureRequired ?? process.env.TELECOM_WEBHOOK_SIGNATURE_REQUIRED === "1";
  const webhookSecrets = options.webhookSecrets ?? {};
  const pilotControls = options.pilotControls ?? createPilotControls(options.pilot);
  const sseClients = new Set();

  function hasOpsAccess(request, url) {
    return requestHasOpsAccess(request, opsAccessKey) || url.searchParams.get("opsKey") === opsAccessKey;
  }

  function broadcast(event, data) {
    for (const client of sseClients) {
      try {
        writeSse(client.response, event, data);
      } catch {
        clearInterval(client.keepAlive);
        sseClients.delete(client);
      }
    }
  }

  function enforceRateLimit(request, response, scope) {
    const result = rateLimiter.check(request, scope);
    if (result.allowed) return true;

    response.writeHead(429, {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "retry-after": String(Math.ceil((result.resetAt - Date.now()) / 1000))
    });
    response.end(JSON.stringify({
      error: "Rate limit exceeded.",
      code: "RATE_LIMITED",
      scope
    }, null, 2));
    return false;
  }

  function enforcePilot(result, response) {
    if (result.allowed) return true;
    sendJson(response, result.statusCode ?? 403, {
      error: result.error,
      code: result.code,
      pilot: pilotControls.status()
    });
    return false;
  }

  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    const pathname = url.pathname;

    try {
      if (pathname === "/api/health") {
        if (request.method !== "GET") {
          methodNotAllowed(response);
          return;
        }

        sendJson(response, 200, {
          ok: true,
          service: "nigeria-trust-api",
          timestamp: new Date().toISOString()
        });
        return;
      }

      if (pathname === "/api/metrics") {
        if (request.method !== "GET") {
          methodNotAllowed(response);
          return;
        }

        const dashboard = await store.getDashboard();
        const queuedOperatorItems = (dashboard.operatorQueue ?? []).reduce((count, item) => {
          const status = item.status;
          const value = Number(item.count ?? 1);
          return status === "queued" ? count + value : count;
        }, 0);
        const metrics = [
          "# HELP nti_active_incidents Active incidents visible to operators.",
          "# TYPE nti_active_incidents gauge",
          `nti_active_incidents ${dashboard.metrics.activeIncidents}`,
          "# HELP nti_critical_incidents Critical active incidents.",
          "# TYPE nti_critical_incidents gauge",
          `nti_critical_incidents ${dashboard.metrics.criticalIncidents}`,
          "# HELP nti_available_responders Available verified responders.",
          "# TYPE nti_available_responders gauge",
          `nti_available_responders ${dashboard.metrics.availableResponders}`,
          "# HELP nti_delivery_queue_queued Queued delivery jobs.",
          "# TYPE nti_delivery_queue_queued gauge",
          `nti_delivery_queue_queued ${dashboard.infrastructure?.queued ?? 0}`,
          "# HELP nti_delivery_queue_retrying Retrying delivery jobs.",
          "# TYPE nti_delivery_queue_retrying gauge",
          `nti_delivery_queue_retrying ${dashboard.infrastructure?.retrying ?? 0}`,
          "# HELP nti_telecom_receipts_total Telecom receipts recorded.",
          "# TYPE nti_telecom_receipts_total counter",
          `nti_telecom_receipts_total ${dashboard.infrastructure?.receipts ?? 0}`,
          "# HELP nti_operator_queue_queued Queued operator work items.",
          "# TYPE nti_operator_queue_queued gauge",
          `nti_operator_queue_queued ${queuedOperatorItems}`,
          "# HELP nti_presence_active Active operator/responder/supervisor presence sessions.",
          "# TYPE nti_presence_active gauge",
          `nti_presence_active ${(dashboard.presence ?? []).length}`,
          "# HELP nti_pilot_shutdown_active Pilot shutdown state.",
          "# TYPE nti_pilot_shutdown_active gauge",
          `nti_pilot_shutdown_active ${pilotControls.shutdown ? 1 : 0}`
        ].join("\n");

        sendText(response, 200, `${metrics}\n`, "text/plain; version=0.0.4; charset=utf-8");
        return;
      }

      if (pathname === "/api/ops/pilot/status") {
        if (request.method !== "GET") {
          methodNotAllowed(response);
          return;
        }

        if (!requireOpsAccess(request, response, opsAccessKey)) {
          return;
        }

        sendJson(response, 200, { pilot: pilotControls.status() });
        return;
      }

      if (pathname === "/api/ops/pilot/shutdown") {
        if (request.method !== "POST") {
          methodNotAllowed(response);
          return;
        }

        if (!requireRole(request, response, opsAccessKey, ["supervisor", "admin"])) {
          return;
        }

        const payload = await parseJsonBody(request);
        const pilot = pilotControls.setShutdown(payload.active !== false);
        broadcast("pilot.shutdown.updated", {
          pilot,
          at: new Date().toISOString()
        });
        sendJson(response, 200, { pilot });
        return;
      }

      if (pathname === "/api/bootstrap") {
        if (request.method !== "GET") {
          methodNotAllowed(response);
          return;
        }

        sendJson(response, 200, await store.getBootstrap());
        return;
      }

      if (pathname === "/api/ops/events") {
        if (request.method !== "GET") {
          methodNotAllowed(response);
          return;
        }

        if (!hasOpsAccess(request, url)) {
          sendJson(response, 401, {
            error: "Operator access key required.",
            code: "OPS_AUTH_REQUIRED"
          });
          return;
        }

        response.writeHead(200, {
          "content-type": "text/event-stream; charset=utf-8",
          "cache-control": "no-store, no-transform",
          connection: "keep-alive",
          "x-accel-buffering": "no",
          ...securityHeaders()
        });
        response.write(": connected\n\n");

        const operatorRef = url.searchParams.get("operatorRef") || "operator";
        const keepAlive = setInterval(() => {
          try {
            writeSse(response, "heartbeat", {
              at: new Date().toISOString(),
              operatorRef
            });
          } catch {
            clearInterval(keepAlive);
          }
        }, 15_000);
        const client = { response, keepAlive };
        sseClients.add(client);

        writeSse(response, "connected", {
          operatorRef,
          at: new Date().toISOString()
        });
        writeSse(response, "dashboard.snapshot", await store.getDashboard());

        request.on("close", () => {
          clearInterval(keepAlive);
          sseClients.delete(client);
        });
        return;
      }

      if (pathname === "/api/ops/session") {
        if (request.method !== "POST") {
          methodNotAllowed(response);
          return;
        }

        if (!requestHasOpsAccess(request, opsAccessKey)) {
          sendJson(response, 401, {
            error: "Operator access key required.",
            code: "OPS_AUTH_REQUIRED"
          });
          return;
        }

        const payload = await parseJsonBody(request);
        const role = ["operator", "supervisor", "admin"].includes(payload.role) ? payload.role : "operator";
        const session = createOperatorSession({
          operatorRef: payload.operatorRef || request.headers["x-operator-ref"] || "operator",
          role
        });
        response.writeHead(201, {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
          "set-cookie": `nti_operator_session=${encodeURIComponent(session.token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${Number(process.env.OPERATOR_SESSION_TTL_SECONDS ?? 3600)}`,
          ...securityHeaders()
        });
        response.end(JSON.stringify({ session }, null, 2));
        return;
      }

      if (pathname === "/api/ops/session/refresh") {
        if (request.method !== "POST") {
          methodNotAllowed(response);
          return;
        }

        const authHeader = request.headers.authorization;
        const token = typeof authHeader === "string" && authHeader.toLowerCase().startsWith("bearer ")
          ? authHeader.slice(7).trim()
          : "";
        const session = rotateOperatorSession(token);
        if (!session) {
          sendJson(response, 401, {
            error: "Operator session refresh failed.",
            code: "OPS_SESSION_INVALID"
          });
          return;
        }

        sendJson(response, 201, { session });
        return;
      }

      if (pathname === "/api/ops/session/revoke") {
        if (request.method !== "POST") {
          methodNotAllowed(response);
          return;
        }

        const session = readOperatorSession(request);
        if (!session) {
          sendJson(response, 401, {
            error: "Operator session required.",
            code: "OPS_SESSION_INVALID"
          });
          return;
        }

        revokeOperatorSession(session.jti);
        sendJson(response, 200, { revoked: true, sessionId: session.jti });
        return;
      }

      if (pathname === "/api/ops/presence") {
        if (request.method !== "POST") {
          methodNotAllowed(response);
          return;
        }

        if (!requireOpsAccess(request, response, opsAccessKey)) {
          return;
        }

        const payload = await parseJsonBody(request);
        const operatorRef = request.headers["x-operator-ref"] || payload.actorRef || "operator";
        const presence = await store.recordPresence({
          actorRef: String(operatorRef),
          actorType: payload.actorType || "operator",
          status: payload.status || "online"
        });

        broadcast("presence.updated", presence);
        sendJson(response, 200, { presence });
        return;
      }

      if (pathname === "/api/ops/dashboard") {
        if (request.method !== "GET") {
          methodNotAllowed(response);
          return;
        }

        if (!requireOpsAccess(request, response, opsAccessKey)) {
          return;
        }

        sendJson(response, 200, await store.getDashboard());
        return;
      }

      if (pathname === "/api/ops/queue/claim") {
        if (request.method !== "POST") {
          methodNotAllowed(response);
          return;
        }

        if (!requireOpsAccess(request, response, opsAccessKey)) {
          return;
        }

        const operatorRef = request.headers["x-operator-ref"] || "operator";
        if (!enforcePilot(pilotControls.enforceOperator(String(operatorRef)), response)) {
          return;
        }

        const item = await store.claimOperatorQueueItem(String(operatorRef));
        broadcast("operator.queue.claimed", { item, operatorRef: String(operatorRef) });
        sendJson(response, 200, { item });
        return;
      }

      const queueReleaseMatch = pathname.match(/^\/api\/ops\/queue\/([^/]+)\/release$/);
      if (queueReleaseMatch) {
        if (request.method !== "POST") {
          methodNotAllowed(response);
          return;
        }

        if (!requireOpsAccess(request, response, opsAccessKey)) {
          return;
        }

        const operatorRef = request.headers["x-operator-ref"] || "operator";
        const item = await store.releaseOperatorQueueItem(queueReleaseMatch[1], String(operatorRef));
        broadcast("operator.queue.released", { item, operatorRef: String(operatorRef) });
        sendJson(response, 200, { item });
        return;
      }

      const queueReassignMatch = pathname.match(/^\/api\/ops\/queue\/([^/]+)\/reassign$/);
      if (queueReassignMatch) {
        if (request.method !== "POST") {
          methodNotAllowed(response);
          return;
        }

        if (!requireRole(request, response, opsAccessKey, ["supervisor", "admin"])) {
          return;
        }

        const payload = await parseJsonBody(request);
        const supervisorRef = request.headers["x-operator-ref"] || "supervisor";
        const item = await store.reassignOperatorQueueItem(queueReassignMatch[1], payload.targetOperatorRef, String(supervisorRef));
        broadcast("operator.queue.reassigned", {
          item,
          supervisorRef: String(supervisorRef),
          targetOperatorRef: payload.targetOperatorRef
        });
        sendJson(response, 200, {
          item
        });
        return;
      }

      if (pathname === "/api/incidents") {
        if (request.method === "GET") {
          sendJson(response, 200, { incidents: await store.listIncidents() });
          return;
        }

        if (request.method === "POST") {
          if (!enforceRateLimit(request, response, "incident-create")) {
            return;
          }

          const payload = await parseJsonBody(request);
          if (!enforcePilot(pilotControls.enforceIncident(payload), response)) {
            return;
          }

          const result = await store.createIncident(payload);
          broadcast("incident.created", result);
          sendJson(response, 201, result);
          return;
        }

        methodNotAllowed(response);
        return;
      }

      if (pathname === "/api/mobile/sync") {
        if (request.method !== "POST") {
          methodNotAllowed(response);
          return;
        }

        if (!enforceRateLimit(request, response, "mobile-sync")) {
          return;
        }

        const payload = await parseJsonBody(request);
        const queuedIncidents = Array.isArray(payload.incidents) ? payload.incidents : [];
        const results = [];

        for (const entry of queuedIncidents) {
          const incidentPayload = {
            requesterName: entry.requesterName ?? entry.requester_name ?? "Resident mobile device",
            incidentType: entry.incidentType ?? entry.type,
            severity: entry.severity,
            locationNote: entry.locationNote ?? entry.landmarks ?? "Mobile offline replay.",
            sharePreciseLocation: Boolean(entry.sharePreciseLocation ?? entry.share_precise_location),
            clientMutationId: entry.clientMutationId ?? entry.idempotencyKey ?? entry.id
          };
          if (!enforcePilot(pilotControls.enforceIncident(incidentPayload), response)) {
            return;
          }

          const result = await store.createIncident(incidentPayload);
          results.push({
            clientMutationId: entry.clientMutationId ?? entry.idempotencyKey ?? entry.id,
            incidentId: result.incident.id,
            version: result.incident.version,
            status: result.incident.status,
            replayed: Boolean(result.replayed)
          });
        }

        broadcast("mobile.sync.replayed", {
          count: results.length,
          at: new Date().toISOString()
        });
        sendJson(response, 202, { results });
        return;
      }

      const dispatchMatch = pathname.match(/^\/api\/incidents\/([^/]+)\/dispatch$/);
      if (dispatchMatch) {
        if (request.method !== "POST") {
          methodNotAllowed(response);
          return;
        }

        if (!requireOpsAccess(request, response, opsAccessKey)) {
          return;
        }

        const incident = await store.dispatchIncident(dispatchMatch[1]);
        broadcast("incident.dispatched", { incident });
        sendJson(response, 200, { incident });
        return;
      }

      const resolveMatch = pathname.match(/^\/api\/incidents\/([^/]+)\/resolve$/);
      if (resolveMatch) {
        if (request.method !== "POST") {
          methodNotAllowed(response);
          return;
        }

        if (!requireOpsAccess(request, response, opsAccessKey)) {
          return;
        }

        const incident = await store.resolveIncident(resolveMatch[1]);
        broadcast("incident.resolved", { incident });
        sendJson(response, 200, { incident });
        return;
      }

      const replayMatch = pathname.match(/^\/api\/incidents\/([^/]+)\/replay$/);
      if (replayMatch) {
        if (request.method !== "GET") {
          methodNotAllowed(response);
          return;
        }

        if (!requireOpsAccess(request, response, opsAccessKey)) {
          return;
        }

        sendJson(response, 200, { events: await store.getIncidentReplay(replayMatch[1]) });
        return;
      }

      const receiptMatch = pathname.match(/^\/api\/telecom\/receipts\/([^/]+)$/);
      if (receiptMatch) {
        if (request.method !== "POST") {
          methodNotAllowed(response);
          return;
        }

        const provider = receiptMatch[1];
        const payload = await parseJsonBody(request);
        const signature = request.headers["x-nti-signature"];
        if (webhookSignatureRequired && !verifyWebhookSignature({
          provider,
          rawBody: request.rawBody ?? "",
          signature: Array.isArray(signature) ? signature[0] : signature,
          secrets: webhookSecrets
        })) {
          sendJson(response, 401, {
            error: "Invalid telecom webhook signature.",
            code: "WEBHOOK_SIGNATURE_INVALID"
          });
          return;
        }

        const receipt = await store.recordTelecomReceipt(provider, normalizeReceipt(provider, payload));
        broadcast("telecom.receipt", { provider, receipt });
        sendJson(response, 202, { receipt });
        return;
      }

      if (pathname === "/" || pathname === "/index.html") {
        await serveFile(response, residentRoot, "index.html");
        return;
      }

      if (pathname === "/ops" || pathname === "/ops/") {
        await serveFile(response, opsRoot, "index.html");
        return;
      }

      if (pathname.startsWith("/resident/")) {
        await serveFile(response, residentRoot, readRoutePath(pathname, "/resident/"));
        return;
      }

      if (pathname.startsWith("/ops/")) {
        await serveFile(response, opsRoot, readRoutePath(pathname, "/ops/"));
        return;
      }

      if (pathname.startsWith("/shared/")) {
        await serveFile(response, sharedRoot, readRoutePath(pathname, "/shared/"));
        return;
      }

      notFound(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected server error.";
      sendJson(response, 500, { error: message });
    }
  });

  server.on("close", () => {
    for (const client of sseClients) {
      clearInterval(client.keepAlive);
      client.response.end();
    }
    sseClients.clear();
  });

  return server;
}

export function startServer(port = Number(process.env.PORT ?? 3000), host = process.env.HOST ?? "127.0.0.1") {
  const opsAccessKey = readOpsAccessKey();
  const server = createAppServer({ opsAccessKey });

  server.listen(port, host, () => {
    console.log(`Nigeria Trust prototype running at http://${host}:${port}`);
    console.log(`Resident app: http://${host}:${port}/`);
    console.log(`Ops console:  http://${host}:${port}/ops`);
    console.log(`Ops key:      ${opsAccessKey}`);
  });

  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === currentFile) {
  startServer();
}
