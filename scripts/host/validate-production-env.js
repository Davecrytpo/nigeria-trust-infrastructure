import { mkdir, writeFile } from "node:fs/promises";
import process from "node:process";

const report = {
  checkedAt: new Date().toISOString(),
  checks: []
};

function check(name, passed, detail = "") {
  report.checks.push({ name, status: passed ? "passed" : "failed", detail });
}

function has(name) {
  return Boolean(process.env[name]?.trim());
}

function isHttpsUrl(name) {
  try {
    const value = process.env[name]?.trim();
    return Boolean(value) && new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function hasHttpsUrlList(name) {
  const value = process.env[name]?.trim();
  if (!value) return false;
  return value.split(",").every((item) => {
    try {
      return new URL(item.trim()).protocol === "https:";
    } catch {
      return false;
    }
  });
}

check("OPS_ACCESS_KEY", has("OPS_ACCESS_KEY") && process.env.OPS_ACCESS_KEY !== "change-this-before-field-use");
check("POSTGRES_PASSWORD", has("POSTGRES_PASSWORD") && process.env.POSTGRES_PASSWORD !== "change-this-before-field-use");
check("GRAFANA_ADMIN_PASSWORD", has("GRAFANA_ADMIN_PASSWORD") && process.env.GRAFANA_ADMIN_PASSWORD !== "change-this-before-field-use");
check("OPERATOR_SESSION_SECRET", has("OPERATOR_SESSION_SECRET"));
check("PUBLIC_BASE_URL_HTTPS", isHttpsUrl("PUBLIC_BASE_URL"));
check("TELECOM_WEBHOOK_URLS_HTTPS", hasHttpsUrlList("TELECOM_WEBHOOK_URLS"));
check("TELECOM_WEBHOOK_SIGNATURE_REQUIRED", process.env.TELECOM_WEBHOOK_SIGNATURE_REQUIRED === "1");
check("RATE_LIMIT_MAX_REQUESTS", Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 0) > 0);
check("RATE_LIMIT_WINDOW_MS", Number(process.env.RATE_LIMIT_WINDOW_MS ?? 0) > 0);
check("TWILIO_CONFIGURED", has("TWILIO_ACCOUNT_SID") && has("TWILIO_AUTH_TOKEN") && has("TWILIO_FROM"));
check("AFRICAS_TALKING_CONFIGURED", has("AFRICAS_TALKING_API_KEY") && has("AFRICAS_TALKING_USERNAME"));
check("INFOBIP_CONFIGURED", has("INFOBIP_API_KEY") && has("INFOBIP_BASE_URL") && has("INFOBIP_FROM"));

const failed = report.checks.filter((item) => item.status === "failed");
report.status = failed.length === 0 ? "passed" : "failed";

await mkdir("reports/runtime", { recursive: true });
const file = `reports/runtime/production-env-validation-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
await writeFile(file, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(`production env validation report: ${file}`);

if (failed.length > 0) {
  for (const item of failed) console.error(`missing/invalid: ${item.name}`);
  process.exit(1);
}
