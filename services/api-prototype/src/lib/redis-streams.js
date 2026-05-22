import net from "node:net";

function encodeRespCommand(parts) {
  const chunks = [`*${parts.length}\r\n`];
  for (const part of parts) {
    const value = String(part);
    chunks.push(`$${Buffer.byteLength(value)}\r\n${value}\r\n`);
  }
  return chunks.join("");
}

function parseRespValue(text, offset = 0) {
  const type = text[offset];
  const lineEnd = text.indexOf("\r\n", offset);
  const header = text.slice(offset + 1, lineEnd);
  const next = lineEnd + 2;

  if (type === "-") throw new Error(header);
  if (type === "+") return { value: header, offset: next };
  if (type === ":") return { value: Number(header), offset: next };
  if (type === "$") {
    const length = Number(header);
    if (length < 0) return { value: null, offset: next };
    return {
      value: text.slice(next, next + length),
      offset: next + length + 2
    };
  }
  if (type === "*") {
    const length = Number(header);
    if (length < 0) return { value: null, offset: next };
    const items = [];
    let current = next;
    for (let index = 0; index < length; index += 1) {
      const parsed = parseRespValue(text, current);
      items.push(parsed.value);
      current = parsed.offset;
    }
    return { value: items, offset: current };
  }

  return { value: text, offset: text.length };
}

function parseResp(buffer) {
  return parseRespValue(buffer.toString("utf8")).value;
}

export class RedisStreamsClient {
  constructor(redisUrl = process.env.REDIS_URL) {
    if (!redisUrl) {
      throw new Error("REDIS_URL is required.");
    }

    this.url = new URL(redisUrl);
  }

  async command(parts) {
    return new Promise((resolve, reject) => {
      const socket = net.createConnection({
        host: this.url.hostname,
        port: Number(this.url.port || 6379)
      });
      const chunks = [];

      socket.on("error", reject);
      socket.on("data", (chunk) => chunks.push(chunk));
      socket.on("end", () => {
        try {
          resolve(parseResp(Buffer.concat(chunks)));
        } catch (error) {
          reject(error);
        }
      });
      socket.on("connect", () => {
        const commands = [];
        if (this.url.password) {
          commands.push(encodeRespCommand(["AUTH", this.url.password]));
        }
        commands.push(encodeRespCommand(parts));
        socket.end(commands.join(""));
      });
    });
  }

  async xadd(stream, fields) {
    const parts = ["XADD", stream, "*"];
    for (const [key, value] of Object.entries(fields)) {
      parts.push(key, typeof value === "string" ? value : JSON.stringify(value));
    }
    return this.command(parts);
  }

  async xgroupCreate(stream, group) {
    try {
      return await this.command(["XGROUP", "CREATE", stream, group, "0", "MKSTREAM"]);
    } catch (error) {
      if (error instanceof Error && error.message.includes("BUSYGROUP")) {
        return "OK";
      }
      throw error;
    }
  }

  async xreadgroup({ group, consumer, stream, count = 10, blockMs = 5000 }) {
    return this.command([
      "XREADGROUP",
      "GROUP",
      group,
      consumer,
      "COUNT",
      count,
      "BLOCK",
      blockMs,
      "STREAMS",
      stream,
      ">"
    ]);
  }

  async xack(stream, group, id) {
    return this.command(["XACK", stream, group, id]);
  }
}
