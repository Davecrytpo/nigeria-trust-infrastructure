import process from "node:process";
import { sendSmsWithFailover } from "../../services/api-prototype/src/lib/telecom-providers.js";
import { runRedisWorker } from "./worker-utils.js";

const stream = process.env.DELIVERY_STREAM ?? "nti:delivery-outbox";
const group = process.env.DELIVERY_GROUP ?? "delivery-workers";
const consumer = process.env.WORKER_ID ?? `delivery-${process.pid}`;
const pollMs = Number(process.env.WORKER_POLL_MS ?? 5000);

async function main() {
  await runRedisWorker({
    stream,
    group,
    consumer,
    pollMs,
    handler: async ({ message }) => {
      const fields = message.fields;
      if (fields.channel === "sms" && fields.to && fields.to !== "responder-pool") {
        await sendSmsWithFailover({
          to: fields.to,
          message: fields.message,
          providerOrder: fields.providerOrder
        });
      }
    }
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
