import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { RedisStreamsClient } from "./redis-streams.js";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = resolve(currentFile, "..");
const defaultDataRoot = resolve(currentDir, "../../../../data/runtime");

function clone(value) {
  return structuredClone(value);
}

function createId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function readJsonFile(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return clone(fallback);
    }

    throw error;
  }
}

async function writeJsonFile(filePath, payload) {
  await mkdir(dirname(filePath), { recursive: true });
  const tempFile = `${filePath}.${process.pid}.tmp`;
  await writeFile(tempFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  await rename(tempFile, filePath);
}

export function createEventInfrastructure(options = {}) {
  const dataRoot = options.dataRoot ?? defaultDataRoot;
  const eventLogFile = options.eventLogFile ?? resolve(dataRoot, "event-log.json");
  const outboxFile = options.outboxFile ?? resolve(dataRoot, "outbox.json");
  const deadLetterFile = options.deadLetterFile ?? resolve(dataRoot, "dead-letter.json");
  const receiptFile = options.receiptFile ?? resolve(dataRoot, "telecom-receipts.json");
  const redis = options.redisClient ?? (process.env.REDIS_URL ? new RedisStreamsClient(process.env.REDIS_URL) : null);
  let writeQueue = Promise.resolve();

  async function mirrorToRedis(stream, fields) {
    if (!redis) return;

    try {
      await redis.xadd(stream, fields);
    } catch (error) {
      await mutateFile(deadLetterFile, { jobs: [] }, (deadLetter) => {
        deadLetter.jobs.push({
          id: createId("redis-dlq"),
          stream,
          fields,
          deadLetterReason: error instanceof Error ? error.message : String(error),
          deadLetteredAt: new Date().toISOString()
        });
      });
    }
  }

  async function mutateFile(filePath, fallback, mutator) {
    writeQueue = writeQueue.then(async () => {
      const state = await readJsonFile(filePath, fallback);
      const result = await mutator(state);
      await writeJsonFile(filePath, state);
      return result;
    });

    return writeQueue;
  }

  async function appendEvent(event) {
    return mutateFile(eventLogFile, { cursor: 0, events: [] }, (log) => {
      log.cursor += 1;
      const recorded = {
        id: event.id ?? createId("evt"),
        sequence: log.cursor,
        incidentId: event.incidentId,
        type: event.type,
        actor: event.actor ?? "system",
        payload: event.payload ?? {},
        idempotencyKey: event.idempotencyKey ?? `${event.incidentId}:${event.type}:${log.cursor}`,
        recordedAt: new Date().toISOString()
      };

      if (log.events.some((item) => item.idempotencyKey === recorded.idempotencyKey)) {
        return log.events.find((item) => item.idempotencyKey === recorded.idempotencyKey);
      }

      log.events.push(recorded);
      void mirrorToRedis("nti:incident-events", recorded);
      return recorded;
    });
  }

  async function enqueueDelivery(job) {
    return mutateFile(outboxFile, { cursor: 0, jobs: [] }, (outbox) => {
      outbox.cursor += 1;
      const queued = {
        id: job.id ?? createId("job"),
        sequence: outbox.cursor,
        status: "queued",
        attempts: 0,
        maxAttempts: job.maxAttempts ?? 5,
        nextAttemptAt: new Date().toISOString(),
        providerOrder: job.providerOrder ?? ["twilio", "africas-talking", "infobip"],
        createdAt: new Date().toISOString(),
        ...job
      };

      outbox.jobs.push(queued);
      void mirrorToRedis("nti:delivery-outbox", queued);
      return queued;
    });
  }

  async function recordDeliveryAttempt(jobId, attempt) {
    return mutateFile(outboxFile, { cursor: 0, jobs: [] }, (outbox) => {
      const job = outbox.jobs.find((item) => item.id === jobId);
      if (!job) return null;

      job.attempts += 1;
      job.lastAttempt = {
        provider: attempt.provider,
        providerMessageId: attempt.providerMessageId ?? null,
        ok: Boolean(attempt.ok),
        error: attempt.error ?? null,
        at: new Date().toISOString()
      };
      job.status = attempt.ok ? "sent" : job.attempts >= job.maxAttempts ? "dead-lettered" : "retrying";
      job.nextAttemptAt = new Date(Date.now() + Math.min(15 * 60_000, 2 ** job.attempts * 15_000)).toISOString();

      return clone(job);
    });
  }

  async function moveToDeadLetter(job, reason) {
    await mutateFile(deadLetterFile, { jobs: [] }, (deadLetter) => {
      deadLetter.jobs.push({
        ...job,
        deadLetterReason: reason,
        deadLetteredAt: new Date().toISOString()
      });
    });
  }

  async function recordReceipt(receipt) {
    const providerMessageId = receipt.providerMessageId ?? receipt.messageId;
    return mutateFile(receiptFile, { receipts: [] }, (state) => {
      const duplicate = state.receipts.find(
        (item) => item.provider === receipt.provider && item.providerMessageId === providerMessageId && item.status === receipt.status
      );

      if (duplicate) {
        duplicate.duplicateCount = (duplicate.duplicateCount ?? 0) + 1;
        duplicate.lastDuplicateAt = new Date().toISOString();
        return clone(duplicate);
      }

      const recorded = {
        id: createId("rcpt"),
        provider: receipt.provider,
        providerMessageId,
        status: receipt.status ?? "unknown",
        to: receipt.to ?? null,
        latencyMs: receipt.latencyMs ?? null,
        raw: receipt.raw ?? receipt,
        receivedAt: new Date().toISOString(),
        duplicateCount: 0
      };

      state.receipts.push(recorded);
      void mirrorToRedis("nti:telecom-receipts", recorded);
      return recorded;
    });
  }

  async function reconstructIncidentTimeline(incidentId) {
    const log = await readJsonFile(eventLogFile, { cursor: 0, events: [] });
    return log.events
      .filter((event) => event.incidentId === incidentId)
      .sort((left, right) => left.sequence - right.sequence);
  }

  async function listQueueState() {
    const [outbox, deadLetter, receipts] = await Promise.all([
      readJsonFile(outboxFile, { cursor: 0, jobs: [] }),
      readJsonFile(deadLetterFile, { jobs: [] }),
      readJsonFile(receiptFile, { receipts: [] })
    ]);

    return {
      queued: outbox.jobs.filter((job) => job.status === "queued").length,
      retrying: outbox.jobs.filter((job) => job.status === "retrying").length,
      sent: outbox.jobs.filter((job) => job.status === "sent").length,
      deadLettered: deadLetter.jobs.length,
      receipts: receipts.receipts.length
    };
  }

  return {
    appendEvent,
    enqueueDelivery,
    recordDeliveryAttempt,
    moveToDeadLetter,
    recordReceipt,
    reconstructIncidentTimeline,
    listQueueState,
    files: {
      eventLogFile,
      outboxFile,
      deadLetterFile,
      receiptFile
    }
  };
}
