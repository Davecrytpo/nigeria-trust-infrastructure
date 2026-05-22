import process from "node:process";
import { createPostgresClient, runRedisWorker } from "./worker-utils.js";

const stream = process.env.TRUST_STREAM ?? "nti:incident-events";
const group = process.env.TRUST_GROUP ?? "trust-quarantine-workers";
const consumer = process.env.WORKER_ID ?? `trust-${process.pid}`;

async function main() {
  const pg = await createPostgresClient();

  await runRedisWorker({
    stream,
    group,
    consumer,
    handler: async ({ message }) => {
      const event = message.fields;
      const riskScore = Number(event.payload?.trustRiskScore ?? 0);
      if (riskScore < 0.7) return;

      await pg.query(
        `
          INSERT INTO trust_reviews (subject_ref, subject_type, review_status, risk_score, note)
          VALUES ($1, $2, 'pending', $3, $4)
        `,
        [
          event.incidentId ?? event.incident_id ?? "unknown",
          "incident",
          riskScore,
          "Automatically quarantined from event stream trust risk signal."
        ]
      );
    }
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
