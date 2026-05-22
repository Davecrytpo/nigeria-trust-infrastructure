import { mkdir, writeFile } from "node:fs/promises";
import process from "node:process";
import { sendSmsWithFailover } from "../../services/api-prototype/src/lib/telecom-providers.js";

const report = {
  startedAt: new Date().toISOString(),
  sends: []
};

function readFlag(name, fallback = "") {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

async function validateProvider(provider, to, message) {
  const startedAt = Date.now();
  try {
    const result = await sendSmsWithFailover({
      to,
      message,
      providerOrder: [provider]
    });
    report.sends.push({
      provider,
      status: "submitted",
      durationMs: Date.now() - startedAt,
      providerMessageId: result.providerMessageId,
      providerStatus: result.status
    });
  } catch (error) {
    report.sends.push({
      provider,
      status: "failed",
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

async function main() {
  const to = readFlag("to", process.env.TELECOM_TEST_TO);
  const message = readFlag("message", `NTI telecom validation ${new Date().toISOString()}`);
  const providers = readFlag("providers", "twilio,africas-talking,infobip")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!to) {
    throw new Error("Set TELECOM_TEST_TO or pass --to=<number> for live telecom validation.");
  }

  for (const provider of providers) {
    await validateProvider(provider, to, message);
  }

  report.finishedAt = new Date().toISOString();
  report.status = report.sends.every((item) => item.status === "submitted") ? "passed" : "failed";

  await mkdir("reports/telecom", { recursive: true });
  const file = `reports/telecom/live-provider-validation-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  await writeFile(file, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`telecom validation report: ${file}`);

  if (report.status !== "passed") process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
