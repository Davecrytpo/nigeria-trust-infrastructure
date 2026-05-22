import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";

function readFlag(name, fallback = "") {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

async function fileExists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function readJsonFiles(directory) {
  if (!(await fileExists(directory))) return [];

  const entries = (await readdir(directory)).sort();
  const jsonFiles = entries.filter((name) => name.endsWith(".json"));
  const results = [];
  for (const name of jsonFiles) {
    try {
      const content = await readFile(join(directory, name), "utf8");
      results.push({
        file: join(directory, name),
        data: JSON.parse(content)
      });
    } catch (error) {
      results.push({
        file: join(directory, name),
        parseError: error instanceof Error ? error.message : String(error)
      });
    }
  }
  return results;
}

async function readTextIfPresent(path) {
  if (!(await fileExists(path))) return "";
  return readFile(path, "utf8");
}

function parseCommandEvidence(commandsNdjson) {
  return commandsNdjson
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return { name: "unparseable-command-record", status: "failed", raw: line };
      }
    });
}

function latestStatus(reports, fallback = "missing") {
  return reports.at(-1)?.data?.status ?? fallback;
}

function latestReport(reports) {
  return reports.at(-1) ?? null;
}

function evidenceState(status) {
  if (status === "passed") return "verified";
  if (status === "failed") return "failed";
  return "missing";
}

function requiredArtifact(name, status, files = [], detail = "") {
  return {
    name,
    status: evidenceState(status),
    files,
    detail
  };
}

function summarizeChecks(runtimeReports, failureReports, commandEvidence, mobileReports, telecomReports, envReports, securityReports) {
  const latestRuntime = runtimeReports.at(-1)?.data;
  const latestFailure = failureReports.at(-1)?.data;
  const latestMobile = mobileReports.at(-1)?.data;
  const latestTelecom = telecomReports.at(-1)?.data;
  const failedCommands = commandEvidence.filter((item) => item.status !== "passed");
  const failedDrills = latestFailure?.drills?.filter((item) => item.status !== "passed") ?? [];

  return {
    runtimeValidation: latestRuntime?.status ?? "missing",
    failureDrills: failedDrills.length === 0 && latestFailure ? "passed" : latestFailure ? "failed" : "missing",
    mobileValidation: latestMobile?.status ?? "missing",
    telecomValidation: latestStatus(telecomReports),
    productionEnvValidation: latestStatus(envReports),
    securityAudit: latestStatus(securityReports),
    commandFailures: failedCommands,
    runtimeMeasurements: latestRuntime?.measurements ?? {},
    failureDrillCount: latestFailure?.drills?.length ?? 0,
    mobileDevice: latestMobile?.device ?? null,
    telecomProviders: latestTelecom?.sends?.map((item) => ({
      provider: item.provider,
      status: item.status,
      durationMs: item.durationMs
    })) ?? []
  };
}

function operationalEvidence(summary, reports, commandEvidence) {
  const runtimeReport = latestReport(reports.validationReports);
  const failureReport = latestReport(reports.failureReports);
  const mobileReport = latestReport(reports.mobileReports);
  const telecomReport = latestReport(reports.telecomReports);
  const securityReport = latestReport(reports.securityReports);
  const envReport = latestReport(reports.envReports);
  const commandNames = new Set(commandEvidence.map((item) => item.name));

  return {
    runtimeProof: [
      requiredArtifact("Docker Compose startup", summary.runtimeValidation, runtimeReport ? [runtimeReport.file] : []),
      requiredArtifact("migration sequencing", commandNames.has("runtime-validate") ? summary.runtimeValidation : "missing", runtimeReport ? [runtimeReport.file] : []),
      requiredArtifact("seed execution", commandNames.has("runtime-validate") ? summary.runtimeValidation : "missing", runtimeReport ? [runtimeReport.file] : []),
      requiredArtifact("Redis Streams recovery", summary.runtimeValidation, runtimeReport ? [runtimeReport.file] : []),
      requiredArtifact("Postgres persistence", summary.runtimeValidation, runtimeReport ? [runtimeReport.file] : []),
      requiredArtifact("worker orchestration", summary.runtimeValidation, runtimeReport ? [runtimeReport.file] : []),
      requiredArtifact("SSE synchronization", summary.runtimeValidation, runtimeReport ? [runtimeReport.file] : []),
      requiredArtifact("Prometheus metrics", commandNames.has("api-metrics") || commandNames.has("post-runtime-api-metrics") ? "passed" : summary.runtimeValidation, runtimeReport ? [runtimeReport.file] : []),
      requiredArtifact("Grafana availability", commandNames.has("grafana-health") ? "passed" : "missing"),
      requiredArtifact("API restart recovery", summary.runtimeValidation, runtimeReport ? [runtimeReport.file] : []),
      requiredArtifact("Redis restart recovery", summary.runtimeValidation, runtimeReport ? [runtimeReport.file] : []),
      requiredArtifact("Postgres restart recovery", summary.failureDrills, failureReport ? [failureReport.file] : [])
    ],
    failureDrills: [
      requiredArtifact("Redis outage", summary.failureDrills, failureReport ? [failureReport.file] : []),
      requiredArtifact("API node restart", summary.failureDrills, failureReport ? [failureReport.file] : []),
      requiredArtifact("worker crash", summary.failureDrills, failureReport ? [failureReport.file] : []),
      requiredArtifact("queue replay recovery", summary.failureDrills, failureReport ? [failureReport.file] : []),
      requiredArtifact("dead-letter recovery", "missing", [], "No live dead-letter drill report was found."),
      requiredArtifact("SSE reconnect storm", summary.runtimeValidation, runtimeReport ? [runtimeReport.file] : []),
      requiredArtifact("telecom failover", summary.telecomValidation, telecomReport ? [telecomReport.file] : []),
      requiredArtifact("partial network partition", "missing", [], "No live partition drill artifact was found.")
    ],
    telecomProof: [
      requiredArtifact("Twilio send and receipt", summary.telecomProviders.some((item) => item.provider === "twilio" && item.status === "submitted") ? "passed" : summary.telecomValidation, telecomReport ? [telecomReport.file] : []),
      requiredArtifact("Africa's Talking send and receipt", summary.telecomProviders.some((item) => item.provider === "africas-talking" && item.status === "submitted") ? "passed" : summary.telecomValidation, telecomReport ? [telecomReport.file] : []),
      requiredArtifact("Infobip send and receipt", summary.telecomProviders.some((item) => item.provider === "infobip" && item.status === "submitted") ? "passed" : summary.telecomValidation, telecomReport ? [telecomReport.file] : []),
      requiredArtifact("webhook signatures", summary.securityAudit, securityReport ? [securityReport.file] : []),
      requiredArtifact("delayed receipts", summary.telecomValidation, telecomReport ? [telecomReport.file] : []),
      requiredArtifact("duplicate suppression", summary.securityAudit, securityReport ? [securityReport.file] : []),
      requiredArtifact("reconciliation integrity", summary.securityAudit, securityReport ? [securityReport.file] : []),
      requiredArtifact("provider outage behavior", summary.telecomValidation, telecomReport ? [telecomReport.file] : [])
    ],
    androidProof: [
      requiredArtifact("offline encrypted queue durability", summary.mobileValidation, mobileReport ? [mobileReport.file] : []),
      requiredArtifact("reboot persistence", summary.mobileValidation, mobileReport ? [mobileReport.file] : []),
      requiredArtifact("app-kill recovery", summary.mobileValidation, mobileReport ? [mobileReport.file] : []),
      requiredArtifact("low battery mode", summary.mobileValidation, mobileReport ? [mobileReport.file] : []),
      requiredArtifact("GPS degradation", summary.mobileValidation, mobileReport ? [mobileReport.file] : []),
      requiredArtifact("background execution restrictions", summary.mobileValidation, mobileReport ? [mobileReport.file] : []),
      requiredArtifact("SMS fallback activation", summary.mobileValidation, mobileReport ? [mobileReport.file] : []),
      requiredArtifact("replay sync recovery", summary.mobileValidation, mobileReport ? [mobileReport.file] : [])
    ],
    securityProof: [
      requiredArtifact("session hijack resistance", summary.securityAudit, securityReport ? [securityReport.file] : []),
      requiredArtifact("replay attack validation", summary.securityAudit, securityReport ? [securityReport.file] : []),
      requiredArtifact("RBAC boundary validation", summary.securityAudit, securityReport ? [securityReport.file] : []),
      requiredArtifact("brute-force protection", summary.securityAudit, securityReport ? [securityReport.file] : []),
      requiredArtifact("refresh token misuse", summary.securityAudit, securityReport ? [securityReport.file] : []),
      requiredArtifact("audit immutability", "missing", [], "No immutable audit log tamper drill artifact was found."),
      requiredArtifact("webhook signature tampering", summary.securityAudit, securityReport ? [securityReport.file] : []),
      requiredArtifact("secret rotation", summary.productionEnvValidation === "passed" ? "missing" : summary.productionEnvValidation, envReport ? [envReport.file] : [], "Requires live rotated secrets and restart evidence.")
    ]
  };
}

function readinessStatus(summary) {
  const blockers = [];
  if (summary.runtimeValidation !== "passed") blockers.push("runtime validation has not passed on live containers");
  if (summary.failureDrills !== "passed") blockers.push("failure drills have not passed on live containers");
  if (summary.mobileValidation !== "passed") blockers.push("mobile validation has not passed on a real device/emulator");
  if (summary.telecomValidation !== "passed") blockers.push("live telecom provider validation has not passed");
  if (summary.productionEnvValidation !== "passed") blockers.push("production environment validation has not passed");
  if (summary.securityAudit !== "passed") blockers.push("security audit controls have not passed");
  if (summary.commandFailures.length > 0) blockers.push("one or more evidence capture commands failed");

  return {
    status: blockers.length === 0 ? "evidence-complete" : "evidence-incomplete",
    blockers
  };
}

async function main() {
  const evidenceDir = readFlag("evidence-dir", "");
  const runtimeDir = "reports/runtime";
  const mobileDir = "reports/mobile";
  const telecomDir = "reports/telecom";
  const securityDir = "reports/security";
  const dossierDir = "reports/readiness";

  const runtimeReports = await readJsonFiles(runtimeDir);
  const failureReports = runtimeReports.filter((item) => item.file.includes("failure-drills-"));
  const validationReports = runtimeReports.filter((item) => item.file.includes("runtime-validation-"));
  const envReports = runtimeReports.filter((item) => item.file.includes("production-env-validation-"));
  const mobileReports = await readJsonFiles(mobileDir);
  const telecomReports = await readJsonFiles(telecomDir);
  const securityReports = await readJsonFiles(securityDir);
  const commandsNdjson = evidenceDir ? await readTextIfPresent(join(evidenceDir, "commands.ndjson")) : "";
  const commandEvidence = parseCommandEvidence(commandsNdjson);
  const summary = summarizeChecks(validationReports, failureReports, commandEvidence, mobileReports, telecomReports, envReports, securityReports);
  const readiness = readinessStatus(summary);
  const reportGroups = {
    runtimeValidationReports: validationReports.map((item) => item.file),
    failureDrillReports: failureReports.map((item) => item.file),
    mobileReports: mobileReports.map((item) => item.file),
    telecomReports: telecomReports.map((item) => item.file),
    productionEnvReports: envReports.map((item) => item.file),
    securityReports: securityReports.map((item) => item.file)
  };
  const evidence = operationalEvidence(summary, {
    validationReports,
    failureReports,
    mobileReports,
    telecomReports,
    envReports,
    securityReports
  }, commandEvidence);

  const dossier = {
    generatedAt: new Date().toISOString(),
    evidenceDir: evidenceDir || null,
    readiness,
    pilotPreparation: {
      status: readiness.status === "evidence-complete" ? "supervised-pilot-prep-eligible" : "blocked",
      scope: {
        geography: "Yaba neighborhood only",
        responderCount: "limited",
        operatorConcurrency: "limited",
        incidentCategories: "low-risk only",
        shutdown: "instant supervisor shutdown required",
        logging: "immutable operational logging required",
        escalation: "supervisor-controlled escalation only"
      },
      blockerPolicy: "No live pilot execution until all live runtime, telecom, Android, security, and observability evidence is verified."
    },
    summary,
    operationalEvidence: evidence,
    reports: reportGroups,
    requiredLiveProof: [
      "runtime:validate on Docker-capable Linux host",
      "runtime:failure-drills on Docker-capable Linux host",
      "mobile:capture-validation from Android app-kill/reboot/offline replay tests",
      "telecom provider sandbox/live receipt and failover evidence",
      "Prometheus/Grafana scrape and dashboard evidence",
      "security:audit evidence for session, RBAC, webhook, rate limit, and pilot controls"
    ]
  };

  await mkdir(dossierDir, { recursive: true });
  const file = `${dossierDir}/operational-readiness-dossier-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  await writeFile(file, `${JSON.stringify(dossier, null, 2)}\n`, "utf8");
  console.log(`readiness dossier: ${file}`);

  if (readiness.status !== "evidence-complete") {
    console.log(`readiness status: ${readiness.status}`);
    for (const blocker of readiness.blockers) {
      console.log(`blocker: ${blocker}`);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
