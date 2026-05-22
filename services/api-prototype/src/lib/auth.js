import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { sendJson } from "./http.js";

export const DEFAULT_OPS_ACCESS_KEY = "yaba-ops-demo-key";
const revokedSessionIds = new Set();

function headerValue(headers, name) {
  const value = headers[name];

  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return typeof value === "string" ? value : "";
}

function base64url(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function decodeBase64urlJson(value) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

function sessionSecret() {
  return process.env.OPERATOR_SESSION_SECRET?.trim() || process.env.OPS_ACCESS_KEY?.trim() || DEFAULT_OPS_ACCESS_KEY;
}

function signSessionPayload(encodedHeader, encodedPayload, secret) {
  return createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64url");
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function readOpsAccessKey() {
  return process.env.OPS_ACCESS_KEY?.trim() || DEFAULT_OPS_ACCESS_KEY;
}

export function requestHasOpsAccess(request, expectedKey) {
  const providedKey = headerValue(request.headers, "x-ops-key").trim();
  return Boolean(providedKey) && providedKey === expectedKey;
}

export function createOperatorSession({
  operatorRef,
  role = "operator",
  ttlSeconds = Number(process.env.OPERATOR_SESSION_TTL_SECONDS ?? 3600),
  previousSessionId = null,
  secret = sessionSecret()
}) {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "HS256",
    typ: "JWT",
    kid: process.env.OPERATOR_SESSION_KEY_ID || "local"
  };
  const payload = {
    sub: operatorRef,
    role,
    iat: now,
    exp: now + ttlSeconds,
    jti: randomUUID(),
    rotatedFrom: previousSessionId
  };
  const encodedHeader = base64url(header);
  const encodedPayload = base64url(payload);
  const signature = signSessionPayload(encodedHeader, encodedPayload, secret);

  return {
    token: `${encodedHeader}.${encodedPayload}.${signature}`,
    expiresAt: new Date(payload.exp * 1000).toISOString(),
    role,
    operatorRef,
    sessionId: payload.jti
  };
}

export function verifyOperatorSession(token, { secret = sessionSecret(), now = Math.floor(Date.now() / 1000) } = {}) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;
  const expected = signSessionPayload(encodedHeader, encodedPayload, secret);
  if (!safeEqual(signature, expected)) return null;

  const payload = decodeBase64urlJson(encodedPayload);
  if (!payload.sub || !payload.exp || payload.exp <= now) return null;
  if (revokedSessionIds.has(payload.jti)) return null;

  return {
    operatorRef: payload.sub,
    role: payload.role || "operator",
    expiresAt: new Date(payload.exp * 1000).toISOString(),
    jti: payload.jti
  };
}

export function revokeOperatorSession(sessionId) {
  if (!sessionId) return false;
  revokedSessionIds.add(sessionId);
  return true;
}

export function rotateOperatorSession(token) {
  const session = verifyOperatorSession(token);
  if (!session) return null;
  revokeOperatorSession(session.jti);
  return createOperatorSession({
    operatorRef: session.operatorRef,
    role: session.role,
    previousSessionId: session.jti
  });
}

export function readOperatorSession(request) {
  const authHeader = headerValue(request.headers, "authorization");
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    return verifyOperatorSession(authHeader.slice(7).trim());
  }

  const cookie = headerValue(request.headers, "cookie");
  const tokenCookie = cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith("nti_operator_session="));
  if (!tokenCookie) return null;
  return verifyOperatorSession(decodeURIComponent(tokenCookie.slice("nti_operator_session=".length)));
}

export function requestHasOperatorSession(request, allowedRoles = ["operator", "supervisor", "admin"]) {
  const session = readOperatorSession(request);
  return Boolean(session && allowedRoles.includes(session.role));
}

export function requireOpsAccess(request, response, expectedKey) {
  if (requestHasOpsAccess(request, expectedKey) || requestHasOperatorSession(request)) {
    return true;
  }

  sendJson(response, 401, {
    error: "Operator access key required.",
    code: "OPS_AUTH_REQUIRED"
  });
  return false;
}

export function requireRole(request, response, expectedKey, allowedRoles) {
  if (requestHasOpsAccess(request, expectedKey)) return true;
  if (requestHasOperatorSession(request, allowedRoles)) return true;

  sendJson(response, 403, {
    error: "Operator role is not permitted for this action.",
    code: "OPS_ROLE_FORBIDDEN"
  });
  return false;
}
