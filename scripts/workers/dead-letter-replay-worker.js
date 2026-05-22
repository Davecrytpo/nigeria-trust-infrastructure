import process from "node:process";
import { createPostgresClient } from "./worker-utils.js";
import { RedisStreamsClient } from "../../services/api-prototype/src/lib/redis-streams.js";

async function main() {
  const pg = await createPostgresClient();
  const redis = new RedisStreamsClient(process.env.REDIS_URL);
  const batch = await pg.query(
    `
      SELECT id, payload
      FROM dead_letter_deliveries
      ORDER BY dead_lettered_at ASC
      LIMIT 100
    `
  );

  for (const row of batch.rows) {
    await redis.xadd("nti:delivery-outbox", row.payload);
    await pg.query("DELETE FROM dead_letter_deliveries WHERE id = $1", [row.id]);
  }

  console.log(`replayed dead letters: ${batch.rowCount}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
