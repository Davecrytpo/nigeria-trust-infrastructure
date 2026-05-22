import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import process from "node:process";

const report = {
  startedAt: new Date().toISOString(),
  checks: [
    "operator session expiry",
    "operator session refresh rotation",
    "operator session revocation",
    "RBAC supervisor boundary",
    "telecom webhook signature enforcement",
    "public incident rate limiting",
    "security headers",
    "pilot shutdown control",
    "pilot incident scope restriction",
    "pilot operator concurrency limit"
  ]
};

function run(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: "pipe",
      shell: false
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("exit", (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

async function main() {
  const result = await run(process.execPath, [
    "--test",
    "services/api-prototype/src/server.test.js",
    "services/api-prototype/src/adversarial.test.js"
  ]);
  report.finishedAt = new Date().toISOString();
  report.status = result.code === 0 ? "passed" : "failed";
  report.testExitCode = result.code;
  report.testOutputTail = result.stdout.split(/\r?\n/).slice(-40);
  report.testErrorTail = result.stderr.split(/\r?\n/).slice(-40);

  await mkdir("reports/security", { recursive: true });
  const file = `reports/security/security-audit-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  await writeFile(file, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`security audit report: ${file}`);

  if (result.code !== 0) {
    process.exit(result.code);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
