function clientAddress(request) {
  const forwardedFor = request.headers["x-forwarded-for"];
  const forwarded = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }

  return request.socket.remoteAddress ?? "unknown";
}

export function createRateLimiter(options = {}) {
  const windowMs = options.windowMs ?? Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
  const maxRequests = options.maxRequests ?? Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 120);
  const buckets = new Map();

  return {
    check(request, scope) {
      const now = Date.now();
      const key = `${scope}:${clientAddress(request)}`;
      const existing = buckets.get(key);

      if (!existing || existing.resetAt <= now) {
        buckets.set(key, {
          count: 1,
          resetAt: now + windowMs
        });
        return {
          allowed: true,
          remaining: Math.max(maxRequests - 1, 0),
          resetAt: now + windowMs
        };
      }

      existing.count += 1;
      return {
        allowed: existing.count <= maxRequests,
        remaining: Math.max(maxRequests - existing.count, 0),
        resetAt: existing.resetAt
      };
    },

    reset() {
      buckets.clear();
    }
  };
}
