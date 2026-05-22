import process from "node:process";
import { createPostgresClient, runRedisWorker } from "./worker-utils.js";

const stream = process.env.REPLAY_STREAM ?? "nti:incident-events";
const group = process.env.REPLAY_GROUP ?? "replay-workers";
const consumer = process.env.WORKER_ID ?? `replay-${process.pid}`;

async function main() {
  const pg = await createPostgresClient();

  await runRedisWorker({
    stream,
    group,
    consumer,
    handler: async ({ message }) => {
      const event = message.fields;
      await pg.query(
        `
          INSERT INTO audit_records (actor_ref, action, subject_ref, payload, previous_hash, record_hash)
          VALUES ($1, $2, $3, $4, $5, encode(digest(($2 || $3 || $4::text || now()::text), 'sha256'), 'hex'))
        `,
        [
          event.actor ?? "system",
          "replay.event.observed",
          event.incidentId ?? event.incident_id ?? "unknown",
          event,
          null
        ]
      );
    }
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
