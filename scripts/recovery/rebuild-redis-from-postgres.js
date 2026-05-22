import process from "node:process";
import pg from "pg";
import { RedisStreamsClient } from "../../services/api-prototype/src/lib/redis-streams.js";

const { Client } = pg;

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
  if (!process.env.REDIS_URL) throw new Error("REDIS_URL is required.");

  const pgClient = new Client({ connectionString: process.env.DATABASE_URL });
  const redis = new RedisStreamsClient(process.env.REDIS_URL);
  await pgClient.connect();

  try {
    const events = await pgClient.query(
      `
        SELECT incident_id, sequence, event_type, actor_ref, idempotency_key, payload, recorded_at
        FROM incident_events
        ORDER BY sequence ASC
      `
    );
    for (const row of events.rows) {
      await redis.xadd("nti:incident-events", row);
    }

    const deliveries = await pgClient.query(
      `
        SELECT id, incident_id, channel, recipient AS to, message, provider_order AS "providerOrder", status, attempts, max_attempts
        FROM delivery_outbox
        WHERE status IN ('queued', 'retrying')
        ORDER BY next_attempt_at ASC
      `
    );
    for (const row of deliveries.rows) {
      await redis.xadd("nti:delivery-outbox", row);
    }

    console.log(`rebuilt Redis streams from Postgres: events=${events.rowCount} deliveries=${deliveries.rowCount}`);
  } finally {
    await pgClient.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
