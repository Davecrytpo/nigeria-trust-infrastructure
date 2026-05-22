import { mkdir, writeFile } from "node:fs/promises";
import process from "node:process";

const reportDir = "reports/mobile";

function readFlag(name, fallback = "") {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

function readNumberFlag(name, fallback = 0) {
  const value = Number(readFlag(name, String(fallback)));
  return Number.isFinite(value) ? value : fallback;
}

function readBoolFlag(name) {
  return process.argv.includes(`--${name}`);
}

const report = {
  capturedAt: new Date().toISOString(),
  device: {
    id: readFlag("device-id", "unknown-device"),
    model: readFlag("model", "unknown-model"),
    androidVersion: readFlag("android-version", "unknown"),
    batterySaver: readBoolFlag("battery-saver"),
    networkProfile: readFlag("network-profile", "unknown")
  },
  validation: {
    appKillRecovery: readBoolFlag("app-kill-recovery"),
    rebootRestoration: readBoolFlag("reboot-restoration"),
    offlineReplaySucceeded: readBoolFlag("offline-replay-succeeded"),
    duplicateSuppressionVerified: readBoolFlag("duplicate-suppression-verified"),
    sseReconnectRecovered: readBoolFlag("sse-reconnect-recovered"),
    delayedSyncReplayMs: readNumberFlag("delayed-sync-replay-ms"),
    offlineDurationMs: readNumberFlag("offline-duration-ms"),
    batteryDropPercent: readNumberFlag("battery-drop-percent"),
    gpsDriftMetersP95: readNumberFlag("gps-drift-meters-p95"),
    failedQueueRows: readNumberFlag("failed-queue-rows")
  },
  notes: readFlag("notes", "")
};

function computeStatus() {
  const required = [
    report.validation.appKillRecovery,
    report.validation.offlineReplaySucceeded,
    report.validation.duplicateSuppressionVerified,
    report.validation.failedQueueRows === 0
  ];
  return required.every(Boolean) ? "passed" : "failed";
}

async function main() {
  report.status = computeStatus();
  await mkdir(reportDir, { recursive: true });
  const file = `${reportDir}/device-validation-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  await writeFile(file, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`mobile device validation report: ${file}`);

  if (report.status !== "passed") {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
