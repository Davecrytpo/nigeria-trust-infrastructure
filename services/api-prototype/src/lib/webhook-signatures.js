import { createHmac, timingSafeEqual } from "node:crypto";

function secretForProvider(provider, secrets = {}) {
  return secrets[provider] ?? process.env[`TELECOM_WEBHOOK_SECRET_${provider.toUpperCase().replace(/-/g, "_")}`];
}

export function signWebhookBody(provider, rawBody, secret) {
  return createHmac("sha256", secret)
    .update(`${provider}.${rawBody}`)
    .digest("hex");
}

export function verifyWebhookSignature({ provider, rawBody, signature, secrets = {} }) {
  const secret = secretForProvider(provider, secrets);
  if (!secret) return false;
  if (!signature || typeof signature !== "string") return false;

  const expected = signWebhookBody(provider, rawBody, secret);
  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(signature, "hex");
  if (expectedBuffer.length !== receivedBuffer.length) return false;

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}
