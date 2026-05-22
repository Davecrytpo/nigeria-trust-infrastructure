import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";

const composeFile = "compose.integration.yaml";
const report = {
  startedAt: new Date().toISOString(),
  drills: []
};

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", shell: false });
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
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch("http://127.0.0.1:3000/api/health");
      if (response.ok) return;
    } catch {
      // continue
    }
    await sleep(2000);
  }
  throw new Error("API failed to recover.");
}

async function createIncident(label) {
  const response = await fetch("http://127.0.0.1:3000/api/incidents", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      requesterName: label,
      incidentType: "medical",
      severity: "critical",
      locationNote: label,
      sharePreciseLocation: false
    })
  });
  if (!response.ok) throw new Error(`create incident failed ${response.status}`);
  return response.json();
}

async function validateSseSnapshot(operatorRef) {
  const response = await fetch(
    `http://127.0.0.1:3000/api/ops/events?opsKey=integration-ops-key&operatorRef=${operatorRef}`
  );
  const reader = response.body.getReader();
  const chunk = Buffer.from((await reader.read()).value).toString("utf8");
  await reader.cancel();
  if (!chunk.includes("event: connected") && !chunk.includes("event: dashboard.snapshot")) {
    throw new Error("operator stream did not restore with a dashboard snapshot");
  }
}

async function validateMobileReplay(label) {
  const mutationId = `failure-drill-${label}-${Date.now()}`;
  const payload = {
    incidents: [
      {
        clientMutationId: mutationId,
        requesterName: label,
        incidentType: "medical",
        severity: "critical",
        locationNote: label,
        sharePreciseLocation: false
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
    throw new Error("mobile replay failed idempotency after recovery");
  }
}

async function drill(name, action) {
  const startedAt = Date.now();
  try {
    await action();
    report.drills.push({ name, status: "passed", durationMs: Date.now() - startedAt });
  } catch (error) {
    report.drills.push({
      name,
      status: "failed",
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

async function main() {
  await run("docker", ["compose", "-f", composeFile, "up", "--build", "-d"]);
  try {
    await waitForApi();
    await drill("api-restart-incident-continuity", async () => {
      const incident = await createIncident("api restart continuity");
      await run("docker", ["compose", "-f", composeFile, "restart", "api"]);
      await waitForApi();
      const replay = await fetch(`http://127.0.0.1:3000/api/incidents/${incident.incident.id}/replay`, {
        headers: { "x-ops-key": "integration-ops-key" }
      }).then((response) => response.json());
      if (!Array.isArray(replay.events) || replay.events.length < 2) throw new Error("replay lost after API restart");
    });

    await drill("worker-crash-recovery", async () => {
      await createIncident("worker crash recovery");
      await run("docker", ["compose", "-f", composeFile, "restart", "delivery-worker", "operator-queue-worker"]);
      await sleep(5000);
      await createIncident("worker crash recovery after restart");
    });

    await drill("operator-sse-reconnect-recovery", async () => {
      await validateSseSnapshot("operator-before-restart");
      await run("docker", ["compose", "-f", composeFile, "restart", "api"]);
      await waitForApi();
      await validateSseSnapshot("operator-after-restart");
    });

    await drill("mobile-replay-restoration", async () => {
      await validateMobileReplay("mobile replay before redis restart");
      await run("docker", ["compose", "-f", composeFile, "restart", "redis"]);
      await sleep(5000);
      await validateMobileReplay("mobile replay after redis restart");
    });

    await drill("redis-restart-rebuild", async () => {
      await createIncident("redis restart rebuild");
      await run("docker", ["compose", "-f", composeFile, "restart", "redis"]);
      await sleep(5000);
      await run("docker", ["compose", "-f", composeFile, "exec", "-T", "api", "node", "scripts/recovery/rebuild-redis-from-postgres.js"]);
    });

    await drill("postgres-restart-api-reconnect", async () => {
      await run("docker", ["compose", "-f", composeFile, "restart", "postgres"]);
      await sleep(10000);
      await waitForApi();
      await createIncident("postgres reconnect");
    });
  } finally {
    report.finishedAt = new Date().toISOString();
    await mkdir("reports/runtime", { recursive: true });
    const file = `reports/runtime/failure-drills-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    await writeFile(file, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.log(`failure drill report: ${file}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
