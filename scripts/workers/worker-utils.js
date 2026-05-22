import process from "node:process";
import pg from "pg";
import { RedisStreamsClient } from "../../services/api-prototype/src/lib/redis-streams.js";

const { Client } = pg;

export function pairsToObject(values = []) {
  const output = {};
  for (let index = 0; index < values.length; index += 2) {
    const key = values[index];
    const raw = values[index + 1];
    try {
      output[key] = JSON.parse(raw);
    } catch {
      output[key] = raw;
    }
  }
  return output;
}

export function streamMessages(response) {
  if (!Array.isArray(response)) return [];
  return response.flatMap((streamEntry) => {
    const entries = streamEntry?.[1] ?? [];
    return entries.map(([id, pairs]) => ({ id, fields: pairsToObject(pairs) }));
  });
}

export async function createPostgresClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for this worker.");
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  return client;
}

export async function runRedisWorker({ stream, group, consumer, pollMs = 5000, handler }) {
  const redis = new RedisStreamsClient(process.env.REDIS_URL);
  await redis.xgroupCreate(stream, group);
  console.log(`worker listening stream=${stream} group=${group} consumer=${consumer}`);

  while (true) {
    const response = await redis.xreadgroup({ group, consumer, stream, count: 10, blockMs: pollMs });
    const messages = streamMessages(response);

    for (const message of messages) {
      try {
        await handler({ message, redis });
        await redis.xack(stream, group, message.id);
        console.log(`ACK ${stream} ${message.id}`);
      } catch (error) {
        console.error(`RETRY ${stream} ${message.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
}
