const SECURITY_HEADERS = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "no-referrer",
  "permissions-policy": "camera=(), microphone=(), payment=()",
  "content-security-policy": "default-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; base-uri 'self'; frame-ancestors 'none'"
};

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  ...SECURITY_HEADERS
};

export function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, JSON_HEADERS);
  response.end(JSON.stringify(payload, null, 2));
}

export function sendText(response, statusCode, text, contentType = "text/plain; charset=utf-8") {
  response.writeHead(statusCode, {
    "content-type": contentType,
    "cache-control": "no-store",
    ...SECURITY_HEADERS
  });
  response.end(text);
}

export function securityHeaders() {
  return SECURITY_HEADERS;
}

export async function parseJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8").trim();
  request.rawBody = raw;

  if (!raw) {
    return {};
  }

  return JSON.parse(raw);
}

export function notFound(response) {
  sendJson(response, 404, { error: "Not found" });
}

export function methodNotAllowed(response) {
  sendJson(response, 405, { error: "Method not allowed" });
}
