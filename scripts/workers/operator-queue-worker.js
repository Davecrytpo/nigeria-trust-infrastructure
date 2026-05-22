import process from "node:process";
import { createPostgresClient, runRedisWorker } from "./worker-utils.js";

const stream = process.env.OPERATOR_QUEUE_STREAM ?? "nti:incident-events";
const group = process.env.OPERATOR_QUEUE_GROUP ?? "operator-queue-workers";
const consumer = process.env.WORKER_ID ?? `operator-queue-${process.pid}`;

async function main() {
  const pg = await createPostgresClient();

  await runRedisWorker({
    stream,
    group,
    consumer,
    handler: async ({ message }) => {
      const event = message.fields;
      const incidentId = event.incidentId ?? event.incident_id;
      if (!incidentId || event.type !== "incident.created") return;

      await pg.query(
        `
          INSERT INTO operator_queue_items (incident_id, queue_name, priority, status)
          VALUES ($1, 'yaba-primary', $2, 'queued')
          ON CONFLICT DO NOTHING
        `,
        [incidentId, event.payload?.severity === "critical" ? 100 : event.payload?.severity === "high" ? 80 : 50]
      );
    }
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
