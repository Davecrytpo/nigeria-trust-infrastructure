import process from "node:process";
import { createPostgresClient, runRedisWorker } from "./worker-utils.js";

const stream = process.env.ESCALATION_STREAM ?? "nti:incident-events";
const group = process.env.ESCALATION_GROUP ?? "incident-escalation-workers";
const consumer = process.env.WORKER_ID ?? `escalation-${process.pid}`;

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
      if (!["critical", "high"].includes(event.payload?.severity)) return;

      await pg.query(
        `
          UPDATE operator_queue_items
          SET priority = GREATEST(priority, $2), updated_at = now()
          WHERE incident_id = $1
        `,
        [incidentId, event.payload.severity === "critical" ? 100 : 80]
      );
    }
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
