import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import process from "node:process";

const composeFile = "compose.integration.yaml";
const reportDir = "reports/runtime";
const report = {
  startedAt: new Date().toISOString(),
  checks: [],
  measurements: {},
  evidence: {}
};

function mark(name, startedAt, extra = {}) {
  const durationMs = Date.now() - startedAt;
  report.checks.push({
    name,
    durationMs,
    at: new Date().toISOString(),
    ...extra
  });
  return durationMs;
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: false,
      ...options
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
    });
  });
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForApi() {
  const startedAt = Date.now();
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch("http://127.0.0.1:3000/api/health");
      if (response.ok) {
        mark("api-health-ready", startedAt);
        return;
      }
    } catch {
      // Retry until startup deadline.
    }
    await sleep(2000);
  }
  throw new Error("API did not become healthy.");
}

async function createIncident(index) {
  const startedAt = Date.now();
  const response = await fetch("http://127.0.0.1:3000/api/incidents", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      requesterName: `integration-${index}`,
      incidentType: index % 2 === 0 ? "medical" : "fire",
      severity: index % 5 === 0 ? "critical" : "high",
      locationNote: `Integration test incident ${index}`,
      sharePreciseLocation: false
    })
  });
  if (!response.ok) throw new Error(`incident create failed ${response.status}`);
  const body = await response.json();
  mark("incident-create", startedAt, { incidentId: body.incident.id });
  return body;
}

async function validateMetrics() {
  const startedAt = Date.now();
  const response = await fetch("http://127.0.0.1:3000/api/metrics");
  const body = await response.text();
  const required = [
    "nti_active_incidents",
    "nti_delivery_queue_queued",
    "nti_operator_queue_queued",
    "nti_presence_active"
  ];
  for (const metric of required) {
    if (!body.includes(metric)) throw new Error(`metrics endpoint missing ${metric}`);
  }
  report.measurements.metricsScrapeMs = mark("prometheus-metrics-scrape", startedAt, { bytes: body.length });
}

async function validateSseReconnect() {
  const startedAt = Date.now();
  const controller = new AbortController();
  const response = await fetch(
    "http://127.0.0.1:3000/api/ops/events?opsKey=integration-ops-key&operatorRef=runtime-validator",
    { signal: controller.signal }
  );
  const reader = response.body.getReader();
  const { value } = await reader.read();
  const chunk = Buffer.from(value).toString("utf8");
  await reader.cancel();
  controller.abort();
  if (!chunk.includes("event: connected") && !chunk.includes("event: dashboard.snapshot")) {
    throw new Error("SSE stream did not deliver reconnect snapshot.");
  }

  const second = await fetch(
    "http://127.0.0.1:3000/api/ops/events?opsKey=integration-ops-key&operatorRef=runtime-validator-reconnect"
  );
  const secondReader = second.body.getReader();
  const secondChunk = Buffer.from((await secondReader.read()).value).toString("utf8");
  await secondReader.cancel();
  if (!secondChunk.includes("event: connected") && !secondChunk.includes("event: dashboard.snapshot")) {
    throw new Error("SSE reconnect did not deliver authoritative snapshot.");
  }
  report.measurements.sseReconnectMs = mark("sse-reconnect-snapshot", startedAt);
}

async function validateMobileReplaySync() {
  const startedAt = Date.now();
  const payload = {
    incidents: [
      {
        clientMutationId: `runtime-mobile-${Date.now()}`,
        requesterName: "runtime mobile replay",
        incidentType: "medical",
        severity: "high",
        locationNote: "runtime mobile replay validation",
        sharePreciseLocation: true
      }
    ]
  };
  const first = await fetch("http://127.0.0.1:3000/api/mobile/sync", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  }).then((response) => response.json());
  const second = await fetch("http://127.0.0.1:3000/api/mobile/sync", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  }).then((response) => response.json());
  if (first.results[0].incidentId !== second.results[0].incidentId || second.results[0].replayed !== true) {
    throw new Error("mobile replay sync did not suppress duplicate mutation.");
  }
  report.measurements.mobileReplaySyncMs = mark("mobile-replay-idempotency", startedAt, {
    incidentId: first.results[0].incidentId
  });
}

async function validateOperatorClaimStorm() {
  const startedAt = Date.now();
  const created = await Promise.all(Array.from({ length: 12 }, (_, index) => createIncident(`claim-${index}`)));
  const claims = await Promise.all(
    Array.from({ length: 12 }, (_, index) =>
      fetch("http://127.0.0.1:3000/api/ops/queue/claim", {
        method: "POST",
        headers: {
          "x-ops-key": "integration-ops-key",
          "x-operator-ref": `operator-${index}`
        }
      }).then((response) => response.json())
    )
  );
  const claimedIds = claims.map((claim) => claim.item?.id).filter(Boolean);
  if (new Set(claimedIds).size !== claimedIds.length) {
    throw new Error("operator claim storm produced duplicate queue ownership.");
  }
  report.measurements.operatorClaimStormMs = mark("operator-claim-storm", startedAt, {
    incidents: created.length,
    claims: claimedIds.length
  });
}

async function validateRuntime() {
  const startedAt = Date.now();
  await waitForApi();
  const createStartedAt = Date.now();
  const created = await Promise.all(Array.from({ length: 25 }, (_, index) => createIncident(index)));
  report.measurements.concurrentIncidentCreateMs = mark("concurrent-incident-create-25", createStartedAt, { count: created.length });
  const replayStartedAt = Date.now();
  const replayResponse = await fetch(`http://127.0.0.1:3000/api/incidents/${created[0].incident.id}/replay`, {
    headers: { "x-ops-key": "integration-ops-key" }
  });
  const replay = await replayResponse.json();
  if (!Array.isArray(replay.events) || replay.events.length < 2) {
    throw new Error("replay reconstruction did not return durable events.");
  }
  report.measurements.replayFetchMs = mark("replay-reconstruction-fetch", replayStartedAt, { events: replay.events.length });

  const dashboardStartedAt = Date.now();
  const dashboardResponse = await fetch("http://127.0.0.1:3000/api/ops/dashboard", {
    headers: { "x-ops-key": "integration-ops-key" }
  });
  const dashboard = await dashboardResponse.json();
  if (!dashboard.infrastructure) {
    throw new Error("dashboard missing infrastructure queue metrics.");
  }
  report.measurements.dashboardFetchMs = mark("operator-dashboard-fetch", dashboardStartedAt, dashboard.infrastructure);

  await validateMetrics();
  await validateSseReconnect();
  await validateMobileReplaySync();
  await validateOperatorClaimStorm();

  mark("runtime-validation-cycle", startedAt);
  console.log(`created=${created.length} replay_events=${replay.events.length}`);
}

async function writeReport(status, error = null) {
  report.finishedAt = new Date().toISOString();
  report.status = status;
  if (error) {
    report.error = error instanceof Error ? error.message : String(error);
  }
  await mkdir(reportDir, { recursive: true });
  const file = `${reportDir}/runtime-validation-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  await writeFile(file, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`runtime report: ${file}`);
}

async function main() {
  try {
    await run("docker", ["--version"]);
  } catch {
    throw new Error("Docker is required for live runtime validation but is not installed or not on PATH.");
  }

  const stackStart = Date.now();
  await run("docker", ["compose", "-f", composeFile, "up", "--build", "-d"]);
  mark("compose-up", stackStart);
  try {
    await validateRuntime();
    const restartStart = Date.now();
    await run("docker", ["compose", "-f", composeFile, "restart", "api", "delivery-worker", "replay-worker"]);
    mark("api-worker-restart", restartStart);
    await waitForApi();
    await validateRuntime();
    const redisRestartStart = Date.now();
    await run("docker", ["compose", "-f", composeFile, "restart", "redis"]);
    mark("redis-restart", redisRestartStart);
    await sleep(5000);
    const rebuildStart = Date.now();
    await run("docker", ["compose", "-f", composeFile, "exec", "-T", "api", "node", "scripts/recovery/rebuild-redis-from-postgres.js"]);
    mark("redis-rebuild-from-postgres", rebuildStart);
    console.log("live runtime validation passed");
    await writeReport("passed");
  } finally {
    if (process.env.KEEP_INTEGRATION_STACK !== "1") {
      await run("docker", ["compose", "-f", composeFile, "down", "-v"]);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  writeReport("failed", error).finally(() => process.exit(1));
});
