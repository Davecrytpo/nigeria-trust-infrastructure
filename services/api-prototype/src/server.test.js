import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createAppServer } from "./server.js";
import { createStore } from "./lib/store.js";
import { createOperatorSession } from "./lib/auth.js";
import { normalizeReceipt, sendSmsWithFailover } from "./lib/telecom-providers.js";
import { signWebhookBody } from "./lib/webhook-signatures.js";

async function withServer(callback, options = {}) {
  const tempRoot = await mkdtemp(join(tmpdir(), "nti-store-"));
  const stateFile = join(tempRoot, "state.json");
  const store = options.store ?? createStore({ stateFile, eventInfrastructureOptions: { dataRoot: join(tempRoot, "runtime") } });
  const opsAccessKey = options.opsAccessKey ?? "test-ops-key";
  const server = createAppServer({ ...options, store, opsAccessKey });

  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await callback(baseUrl, { stateFile, opsAccessKey });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("health endpoint responds", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
  });
});

test("incident creation and dispatch flow works", async () => {
  await withServer(async (baseUrl, context) => {
    const createResponse = await fetch(`${baseUrl}/api/incidents`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        requesterName: "Session tester",
        incidentType: "fire",
        severity: "high",
        locationNote: "Electrical room near the market gate.",
        sharePreciseLocation: true
      })
    });

    const createdBody = await createResponse.json();

    assert.equal(createResponse.status, 201);
    assert.equal(createdBody.incident.incidentType, "fire");

    const dispatchResponse = await fetch(
      `${baseUrl}/api/incidents/${createdBody.incident.id}/dispatch`,
      {
        method: "POST",
        headers: {
          "x-ops-key": context.opsAccessKey
        }
      }
    );
    const dispatchBody = await dispatchResponse.json();

    assert.equal(dispatchResponse.status, 200);
    assert.equal(dispatchBody.incident.status, "dispatching");
    assert.ok(dispatchBody.incident.assignedResponder);
  });
});

test("ops dashboard requires operator access key", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/ops/dashboard`);
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.code, "OPS_AUTH_REQUIRED");
  });
});

test("operator session token grants dashboard access and applies security headers", async () => {
  process.env.OPERATOR_SESSION_SECRET = "session-test-secret";
  await withServer(async (baseUrl, context) => {
    const sessionResponse = await fetch(`${baseUrl}/api/ops/session`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-ops-key": context.opsAccessKey
      },
      body: JSON.stringify({
        operatorRef: "operator-session-test",
        role: "operator"
      })
    });
    const sessionBody = await sessionResponse.json();
    const dashboardResponse = await fetch(`${baseUrl}/api/ops/dashboard`, {
      headers: {
        authorization: `Bearer ${sessionBody.session.token}`
      }
    });

    assert.equal(sessionResponse.status, 201);
    assert.equal(dashboardResponse.status, 200);
    assert.equal(dashboardResponse.headers.get("x-frame-options"), "DENY");
    assert.match(dashboardResponse.headers.get("content-security-policy"), /default-src 'self'/);
  });
});

test("operator role cannot perform supervisor queue reassignment", async () => {
  process.env.OPERATOR_SESSION_SECRET = "session-test-secret";
  await withServer(async (baseUrl, context) => {
    const createResponse = await fetch(`${baseUrl}/api/incidents`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        requesterName: "RBAC tester",
        incidentType: "fire",
        severity: "critical",
        locationNote: "RBAC queue test.",
        sharePreciseLocation: false
      })
    });
    assert.equal(createResponse.status, 201);

    const claimResponse = await fetch(`${baseUrl}/api/ops/queue/claim`, {
      method: "POST",
      headers: {
        "x-ops-key": context.opsAccessKey,
        "x-operator-ref": "operator-rbac"
      }
    });
    const claimBody = await claimResponse.json();
    const sessionResponse = await fetch(`${baseUrl}/api/ops/session`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-ops-key": context.opsAccessKey
      },
      body: JSON.stringify({
        operatorRef: "operator-rbac",
        role: "operator"
      })
    });
    const sessionBody = await sessionResponse.json();
    const reassignResponse = await fetch(`${baseUrl}/api/ops/queue/${claimBody.item.id}/reassign`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${sessionBody.session.token}`
      },
      body: JSON.stringify({
        targetOperatorRef: "operator-other"
      })
    });
    const reassignBody = await reassignResponse.json();

    assert.equal(reassignResponse.status, 403);
    assert.equal(reassignBody.code, "OPS_ROLE_FORBIDDEN");
  });
});

test("expired operator session is rejected", async () => {
  process.env.OPERATOR_SESSION_SECRET = "session-test-secret";
  await withServer(async (baseUrl) => {
    const expired = createOperatorSession({
      operatorRef: "expired-operator",
      role: "operator",
      ttlSeconds: -1,
      secret: "session-test-secret"
    });
    const response = await fetch(`${baseUrl}/api/ops/dashboard`, {
      headers: {
        authorization: `Bearer ${expired.token}`
      }
    });
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.code, "OPS_AUTH_REQUIRED");
  });
});

test("operator session refresh rotates and invalidates the previous token", async () => {
  process.env.OPERATOR_SESSION_SECRET = "session-test-secret";
  await withServer(async (baseUrl, context) => {
    const sessionResponse = await fetch(`${baseUrl}/api/ops/session`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-ops-key": context.opsAccessKey
      },
      body: JSON.stringify({
        operatorRef: "refresh-operator",
        role: "operator"
      })
    });
    const sessionBody = await sessionResponse.json();
    const refreshResponse = await fetch(`${baseUrl}/api/ops/session/refresh`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${sessionBody.session.token}`
      }
    });
    const refreshBody = await refreshResponse.json();
    const oldTokenResponse = await fetch(`${baseUrl}/api/ops/dashboard`, {
      headers: {
        authorization: `Bearer ${sessionBody.session.token}`
      }
    });
    const newTokenResponse = await fetch(`${baseUrl}/api/ops/dashboard`, {
      headers: {
        authorization: `Bearer ${refreshBody.session.token}`
      }
    });

    assert.equal(refreshResponse.status, 201);
    assert.notEqual(refreshBody.session.token, sessionBody.session.token);
    assert.equal(oldTokenResponse.status, 401);
    assert.equal(newTokenResponse.status, 200);
  });
});

test("operator session revocation invalidates token", async () => {
  process.env.OPERATOR_SESSION_SECRET = "session-test-secret";
  await withServer(async (baseUrl, context) => {
    const sessionResponse = await fetch(`${baseUrl}/api/ops/session`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-ops-key": context.opsAccessKey
      },
      body: JSON.stringify({
        operatorRef: "revoked-operator",
        role: "operator"
      })
    });
    const sessionBody = await sessionResponse.json();
    const revokeResponse = await fetch(`${baseUrl}/api/ops/session/revoke`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${sessionBody.session.token}`
      }
    });
    const dashboardResponse = await fetch(`${baseUrl}/api/ops/dashboard`, {
      headers: {
        authorization: `Bearer ${sessionBody.session.token}`
      }
    });

    assert.equal(revokeResponse.status, 200);
    assert.equal(dashboardResponse.status, 401);
  });
});

test("ops dashboard returns seeded operational data when authorized", async () => {
  await withServer(async (baseUrl, context) => {
    const response = await fetch(`${baseUrl}/api/ops/dashboard`, {
      headers: {
        "x-ops-key": context.opsAccessKey
      }
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.ok(body.metrics.activeIncidents >= 1);
    assert.ok(Array.isArray(body.responders));
    assert.ok(Array.isArray(body.trustQueue));
  });
});

test("metrics endpoint exposes operational counters", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/metrics`);
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.match(body, /nti_active_incidents/);
    assert.match(body, /nti_delivery_queue_queued/);
    assert.match(body, /nti_presence_active/);
  });
});

test("ops event stream emits live dashboard snapshots", async () => {
  await withServer(async (baseUrl, context) => {
    const controller = new AbortController();
    const response = await fetch(
      `${baseUrl}/api/ops/events?opsKey=${encodeURIComponent(context.opsAccessKey)}&operatorRef=test-operator`,
      { signal: controller.signal }
    );
    const reader = response.body.getReader();
    const { value } = await reader.read();
    const body = Buffer.from(value).toString("utf8");

    await reader.cancel();
    controller.abort();

    assert.equal(response.status, 200);
    assert.match(body, /event: connected|event: dashboard\.snapshot/);
  });
});

test("operator presence heartbeat is visible in dashboard state", async () => {
  await withServer(async (baseUrl, context) => {
    const response = await fetch(`${baseUrl}/api/ops/presence`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-ops-key": context.opsAccessKey,
        "x-operator-ref": "operator-presence-test"
      },
      body: JSON.stringify({
        actorType: "operator",
        status: "online"
      })
    });
    const body = await response.json();

    const dashboardResponse = await fetch(`${baseUrl}/api/ops/dashboard`, {
      headers: {
        "x-ops-key": context.opsAccessKey
      }
    });
    const dashboardBody = await dashboardResponse.json();
    const presence = dashboardBody.presence.find((item) => item.actorRef === "operator-presence-test");

    assert.equal(response.status, 200);
    assert.equal(body.presence.status, "online");
    assert.ok(presence);
  });
});

test("operator queue claim and release preserves ownership", async () => {
  await withServer(async (baseUrl, context) => {
    const createResponse = await fetch(`${baseUrl}/api/incidents`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        requesterName: "Queue tester",
        incidentType: "fire",
        severity: "critical",
        locationNote: "Queue ownership test.",
        sharePreciseLocation: false
      })
    });
    assert.equal(createResponse.status, 201);

    const claimResponse = await fetch(`${baseUrl}/api/ops/queue/claim`, {
      method: "POST",
      headers: {
        "x-ops-key": context.opsAccessKey,
        "x-operator-ref": "operator-a"
      }
    });
    const claimBody = await claimResponse.json();

    assert.equal(claimResponse.status, 200);
    assert.equal(claimBody.item.status, "locked");
    assert.equal(claimBody.item.ownerOperatorRef, "operator-a");

    const releaseResponse = await fetch(`${baseUrl}/api/ops/queue/${claimBody.item.id}/release`, {
      method: "POST",
      headers: {
        "x-ops-key": context.opsAccessKey,
        "x-operator-ref": "operator-a"
      }
    });
    const releaseBody = await releaseResponse.json();

    assert.equal(releaseResponse.status, 200);
    assert.equal(releaseBody.item.status, "queued");
    assert.equal(releaseBody.item.ownerOperatorRef, null);
  });
});

test("duplicate dispatch requests are idempotent", async () => {
  await withServer(async (baseUrl, context) => {
    const createResponse = await fetch(`${baseUrl}/api/incidents`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        requesterName: "Duplicate dispatch tester",
        incidentType: "fire",
        severity: "high",
        locationNote: "Concurrent dispatch protection test.",
        sharePreciseLocation: false
      })
    });
    const createdBody = await createResponse.json();

    const first = await fetch(`${baseUrl}/api/incidents/${createdBody.incident.id}/dispatch`, {
      method: "POST",
      headers: {
        "x-ops-key": context.opsAccessKey
      }
    });
    const second = await fetch(`${baseUrl}/api/incidents/${createdBody.incident.id}/dispatch`, {
      method: "POST",
      headers: {
        "x-ops-key": context.opsAccessKey
      }
    });
    const firstBody = await first.json();
    const secondBody = await second.json();
    const replayResponse = await fetch(`${baseUrl}/api/incidents/${createdBody.incident.id}/replay`, {
      headers: {
        "x-ops-key": context.opsAccessKey
      }
    });
    const replayBody = await replayResponse.json();
    const dispatchedEvents = replayBody.events.filter((item) => item.type === "incident.dispatched");

    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.equal(firstBody.incident.assignedResponderId, secondBody.incident.assignedResponderId);
    assert.equal(dispatchedEvents.length, 1);
  });
});

test("mobile sync suppresses duplicate offline replay mutations", async () => {
  await withServer(async (baseUrl) => {
    const payload = {
      incidents: [
        {
          clientMutationId: "mobile-replay-001",
          requesterName: "Offline resident",
          incidentType: "medical",
          severity: "high",
          locationNote: "Queued during offline mode.",
          sharePreciseLocation: true
        }
      ]
    };

    const first = await fetch(`${baseUrl}/api/mobile/sync`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const second = await fetch(`${baseUrl}/api/mobile/sync`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const firstBody = await first.json();
    const secondBody = await second.json();
    const incidentResponse = await fetch(`${baseUrl}/api/incidents`);
    const incidentBody = await incidentResponse.json();
    const replayedIncidents = incidentBody.incidents.filter((item) => item.clientMutationId === "mobile-replay-001");

    assert.equal(first.status, 202);
    assert.equal(second.status, 202);
    assert.equal(firstBody.results[0].incidentId, secondBody.results[0].incidentId);
    assert.equal(secondBody.results[0].replayed, true);
    assert.equal(replayedIncidents.length, 1);
  });
});

test("trust OTP send and verify flow enforces code attempts", async () => {
  await withServer(async (baseUrl) => {
    const sendResponse = await fetch(`${baseUrl}/api/trust/otp/send`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        phoneNumber: "08031234567"
      })
    });
    const sendBody = await sendResponse.json();
    const wrongResponse = await fetch(`${baseUrl}/api/trust/otp/verify`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        sessionToken: sendBody.sessionToken,
        code: "000000"
      })
    });
    const wrongBody = await wrongResponse.json();
    const verifyResponse = await fetch(`${baseUrl}/api/trust/otp/verify`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        sessionToken: sendBody.sessionToken,
        code: sendBody.__demo_code
      })
    });
    const verifyBody = await verifyResponse.json();

    assert.equal(sendResponse.status, 200);
    assert.match(sendBody.sessionToken, /^[a-f0-9]+$/);
    assert.equal(wrongResponse.status, 401);
    assert.equal(wrongBody.attemptsRemaining, 4);
    assert.equal(verifyResponse.status, 200);
    assert.equal(verifyBody.verified, true);
  });
});

test("trust proof creation persists by artisan and accepts media registration", async () => {
  await withServer(async (baseUrl) => {
    const createResponse = await fetch(`${baseUrl}/api/trust/proofs`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        artisanId: "resident-aisha",
        title: "Yaba shop lighting repair",
        category: "Electrical Repair",
        location: "Yaba"
      })
    });
    const proof = await createResponse.json();
    const uploadIntentResponse = await fetch(`${baseUrl}/api/trust/media/upload-intents`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        proofId: proof.id,
        mediaRole: "before"
      })
    });
    const uploadIntent = await uploadIntentResponse.json();
    const uploadResponse = await fetch(uploadIntent.uploadUrl, {
      method: "PUT",
      body: "test-image"
    });
    const mediaResponse = await fetch(`${baseUrl}/api/trust/media`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        proofId: proof.id,
        mediaRole: "before",
        storageKey: uploadIntent.storageKey
      })
    });
    const listResponse = await fetch(`${baseUrl}/api/trust/profiles/resident-aisha/proofs`);
    const listBody = await listResponse.json();

    assert.equal(createResponse.status, 201);
    assert.equal(proof.title, "Yaba shop lighting repair");
    assert.equal(uploadIntentResponse.status, 201);
    assert.equal(uploadResponse.status, 200);
    assert.equal(mediaResponse.status, 201);
    assert.equal(listResponse.status, 200);
    assert.equal(listBody.length, 1);
    assert.equal(listBody[0].id, proof.id);
  });
});

test("incidents persist to the local state file", async () => {
  await withServer(async (baseUrl, context) => {
    const createResponse = await fetch(`${baseUrl}/api/incidents`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        requesterName: "Persistent tester",
        incidentType: "medical",
        severity: "moderate",
        locationNote: "Testing saved incident state.",
        sharePreciseLocation: false
      })
    });

    assert.equal(createResponse.status, 201);

    const stored = JSON.parse(await readFile(context.stateFile, "utf8"));
    const savedIncident = stored.incidents.find((item) => item.requesterName === "Persistent tester");

    assert.ok(savedIncident);
    assert.equal(savedIncident.incidentType, "medical");
  });
});

test("incident lifecycle writes durable replay events and outbox state", async () => {
  await withServer(async (baseUrl, context) => {
    const createResponse = await fetch(`${baseUrl}/api/incidents`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        requesterName: "Replay tester",
        incidentType: "medical",
        severity: "high",
        locationNote: "Replay evidence test.",
        sharePreciseLocation: false
      })
    });
    const createdBody = await createResponse.json();

    const replayResponse = await fetch(`${baseUrl}/api/incidents/${createdBody.incident.id}/replay`, {
      headers: {
        "x-ops-key": context.opsAccessKey
      }
    });
    const replayBody = await replayResponse.json();

    const dashboardResponse = await fetch(`${baseUrl}/api/ops/dashboard`, {
      headers: {
        "x-ops-key": context.opsAccessKey
      }
    });
    const dashboardBody = await dashboardResponse.json();

    assert.equal(replayResponse.status, 200);
    assert.equal(replayBody.events[0].type, "incident.created");
    assert.ok(dashboardBody.infrastructure.queued >= 1);
  });
});

test("telecom receipt webhook deduplicates provider delivery state", async () => {
  await withServer(async (baseUrl) => {
    const payload = {
      MessageSid: "SM123",
      MessageStatus: "delivered",
      To: "+2348012345678"
    };

    const first = await fetch(`${baseUrl}/api/telecom/receipts/twilio`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const second = await fetch(`${baseUrl}/api/telecom/receipts/twilio`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const body = await second.json();

    assert.equal(first.status, 202);
    assert.equal(second.status, 202);
    assert.equal(body.receipt.providerMessageId, "SM123");
    assert.equal(body.receipt.duplicateCount, 1);
  });
});

test("telecom receipt webhook enforces signatures when required", async () => {
  await withServer(async (baseUrl) => {
    const payload = {
      MessageSid: "SM-SIGNED-1",
      MessageStatus: "delivered",
      To: "+2348012345678"
    };
    const rawBody = JSON.stringify(payload);
    const invalid = await fetch(`${baseUrl}/api/telecom/receipts/twilio`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-nti-signature": "00"
      },
      body: rawBody
    });
    const valid = await fetch(`${baseUrl}/api/telecom/receipts/twilio`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-nti-signature": signWebhookBody("twilio", rawBody, "test-secret")
      },
      body: rawBody
    });

    assert.equal(invalid.status, 401);
    assert.equal(valid.status, 202);
  }, {
    webhookSignatureRequired: true,
    webhookSecrets: {
      twilio: "test-secret"
    }
  });
});

test("public incident creation is rate limited under abuse load", async () => {
  await withServer(async (baseUrl) => {
    const request = () => fetch(`${baseUrl}/api/incidents`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        requesterName: "Rate limit tester",
        incidentType: "medical",
        severity: "high",
        locationNote: "Rate limit test.",
        sharePreciseLocation: false
      })
    });

    const first = await request();
    const second = await request();
    const third = await request();
    const body = await third.json();

    assert.equal(first.status, 201);
    assert.equal(second.status, 201);
    assert.equal(third.status, 429);
    assert.equal(body.code, "RATE_LIMITED");
  }, {
    rateLimit: {
      windowMs: 60_000,
      maxRequests: 2
    }
  });
});

test("pilot mode restricts high-risk incident categories", async () => {
  await withServer(async (baseUrl) => {
    const restricted = await fetch(`${baseUrl}/api/incidents`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        requesterName: "Pilot restriction tester",
        incidentType: "security",
        severity: "high",
        locationNote: "Restricted incident type.",
        sharePreciseLocation: false
      })
    });
    const allowed = await fetch(`${baseUrl}/api/incidents`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        requesterName: "Pilot allowed tester",
        incidentType: "medical",
        severity: "moderate",
        locationNote: "Allowed pilot incident.",
        sharePreciseLocation: false
      })
    });
    const restrictedBody = await restricted.json();

    assert.equal(restricted.status, 403);
    assert.equal(restrictedBody.code, "PILOT_INCIDENT_TYPE_RESTRICTED");
    assert.equal(allowed.status, 201);
  }, {
    pilot: {
      enabled: true,
      allowedIncidentTypes: ["medical", "help"],
      allowedSeverities: ["moderate", "high"]
    }
  });
});

test("pilot shutdown blocks new incidents until supervisor reopens", async () => {
  process.env.OPERATOR_SESSION_SECRET = "session-test-secret";
  await withServer(async (baseUrl, context) => {
    const shutdown = await fetch(`${baseUrl}/api/ops/pilot/shutdown`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-ops-key": context.opsAccessKey
      },
      body: JSON.stringify({ active: true })
    });
    const blocked = await fetch(`${baseUrl}/api/incidents`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        requesterName: "Shutdown tester",
        incidentType: "medical",
        severity: "moderate",
        locationNote: "Should be blocked.",
        sharePreciseLocation: false
      })
    });
    const reopen = await fetch(`${baseUrl}/api/ops/pilot/shutdown`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-ops-key": context.opsAccessKey
      },
      body: JSON.stringify({ active: false })
    });
    const allowed = await fetch(`${baseUrl}/api/incidents`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        requesterName: "Reopened tester",
        incidentType: "medical",
        severity: "moderate",
        locationNote: "Should be allowed.",
        sharePreciseLocation: false
      })
    });
    const blockedBody = await blocked.json();

    assert.equal(shutdown.status, 200);
    assert.equal(blocked.status, 503);
    assert.equal(blockedBody.code, "PILOT_SHUTDOWN_ACTIVE");
    assert.equal(reopen.status, 200);
    assert.equal(allowed.status, 201);
  }, {
    pilot: {
      enabled: true,
      allowedIncidentTypes: ["medical"],
      allowedSeverities: ["moderate"]
    }
  });
});

test("pilot mode limits operator concurrency", async () => {
  await withServer(async (baseUrl, context) => {
    const create = async (index) => fetch(`${baseUrl}/api/incidents`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        requesterName: `Concurrency ${index}`,
        incidentType: "medical",
        severity: "moderate",
        locationNote: `Concurrency ${index}`,
        sharePreciseLocation: false
      })
    });
    await create(1);
    await create(2);

    const first = await fetch(`${baseUrl}/api/ops/queue/claim`, {
      method: "POST",
      headers: {
        "x-ops-key": context.opsAccessKey,
        "x-operator-ref": "operator-one"
      }
    });
    const second = await fetch(`${baseUrl}/api/ops/queue/claim`, {
      method: "POST",
      headers: {
        "x-ops-key": context.opsAccessKey,
        "x-operator-ref": "operator-two"
      }
    });
    const secondBody = await second.json();

    assert.equal(first.status, 200);
    assert.equal(second.status, 429);
    assert.equal(secondBody.code, "PILOT_OPERATOR_CONCURRENCY_LIMIT");
  }, {
    pilot: {
      enabled: true,
      allowedIncidentTypes: ["medical"],
      allowedSeverities: ["moderate"],
      maxOperatorConcurrency: 1
    }
  });
});

test("sms failover uses the first healthy real provider adapter", async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(String(url));

    if (String(url).includes("twilio")) {
      return {
        ok: false,
        json: async () => ({ message: "twilio unavailable" })
      };
    }

    return {
      ok: true,
      json: async () => ({
        SMSMessageData: {
          Recipients: [{ messageId: "AT-1", status: "Success" }]
        }
      })
    };
  };

  process.env.TWILIO_ACCOUNT_SID = "sid";
  process.env.TWILIO_AUTH_TOKEN = "token";
  process.env.TWILIO_FROM = "+10000000000";
  process.env.AFRICAS_TALKING_API_KEY = "key";
  process.env.AFRICAS_TALKING_USERNAME = "sandbox";

  const result = await sendSmsWithFailover({
    to: "+2348012345678",
    message: "test",
    providerOrder: ["twilio", "africas-talking"],
    fetchImpl
  });

  assert.equal(result.provider, "africas-talking");
  assert.equal(result.providerMessageId, "AT-1");
  assert.equal(calls.length, 2);
});

test("receipt normalization handles Infobip delivery webhooks", () => {
  const receipt = normalizeReceipt("infobip", {
    results: [
      {
        messageId: "info-1",
        to: "2348012345678",
        status: { groupName: "DELIVERED" }
      }
    ]
  });

  assert.equal(receipt.providerMessageId, "info-1");
  assert.equal(receipt.status, "DELIVERED");
});
