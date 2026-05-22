function required(name, value) {
  if (!value) {
    throw new Error(`${name} is required for this SMS provider.`);
  }
}

export function normalizeReceipt(provider, payload = {}) {
  if (provider === "twilio") {
    return {
      provider,
      providerMessageId: payload.MessageSid,
      status: payload.MessageStatus ?? payload.SmsStatus,
      to: payload.To,
      raw: payload
    };
  }

  if (provider === "africas-talking") {
    return {
      provider,
      providerMessageId: payload.id ?? payload.messageId,
      status: payload.status,
      to: payload.phoneNumber ?? payload.to,
      raw: payload
    };
  }

  if (provider === "infobip") {
    const result = Array.isArray(payload.results) ? payload.results[0] : payload;
    return {
      provider,
      providerMessageId: result.messageId,
      status: result.status?.groupName ?? result.status?.name ?? payload.status,
      to: result.to ?? payload.to,
      raw: payload
    };
  }

  return {
    provider,
    providerMessageId: payload.providerMessageId ?? payload.messageId,
    status: payload.status ?? "unknown",
    to: payload.to,
    raw: payload
  };
}

export async function sendWithTwilio({ to, message, from, config = {}, fetchImpl = fetch }) {
  const accountSid = config.accountSid ?? process.env.TWILIO_ACCOUNT_SID;
  const authToken = config.authToken ?? process.env.TWILIO_AUTH_TOKEN;
  const sender = from ?? config.from ?? process.env.TWILIO_FROM;

  required("TWILIO_ACCOUNT_SID", accountSid);
  required("TWILIO_AUTH_TOKEN", authToken);
  required("TWILIO_FROM", sender);

  const body = new URLSearchParams({ To: to, From: sender, Body: message });
  const response = await fetchImpl(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "content-type": "application/x-www-form-urlencoded"
    },
    body
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message ?? "Twilio SMS send failed.");
  }

  return {
    provider: "twilio",
    providerMessageId: payload.sid,
    status: payload.status,
    raw: payload
  };
}

export async function sendWithAfricasTalking({ to, message, from, config = {}, fetchImpl = fetch }) {
  const apiKey = config.apiKey ?? process.env.AFRICAS_TALKING_API_KEY;
  const username = config.username ?? process.env.AFRICAS_TALKING_USERNAME;
  const sender = from ?? config.from ?? process.env.AFRICAS_TALKING_FROM;

  required("AFRICAS_TALKING_API_KEY", apiKey);
  required("AFRICAS_TALKING_USERNAME", username);

  const body = new URLSearchParams({ username, to, message });
  if (sender) body.set("from", sender);

  const response = await fetchImpl("https://api.africastalking.com/version1/messaging", {
    method: "POST",
    headers: {
      apiKey,
      "content-type": "application/x-www-form-urlencoded",
      accept: "application/json"
    },
    body
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.errorMessage ?? "Africa's Talking SMS send failed.");
  }

  const recipient = payload.SMSMessageData?.Recipients?.[0] ?? {};
  return {
    provider: "africas-talking",
    providerMessageId: recipient.messageId,
    status: recipient.status,
    raw: payload
  };
}

export async function sendWithInfobip({ to, message, from, config = {}, fetchImpl = fetch }) {
  const apiKey = config.apiKey ?? process.env.INFOBIP_API_KEY;
  const baseUrl = config.baseUrl ?? process.env.INFOBIP_BASE_URL;
  const sender = from ?? config.from ?? process.env.INFOBIP_FROM;

  required("INFOBIP_API_KEY", apiKey);
  required("INFOBIP_BASE_URL", baseUrl);
  required("INFOBIP_FROM", sender);

  const response = await fetchImpl(`${baseUrl.replace(/\/$/, "")}/sms/2/text/advanced`, {
    method: "POST",
    headers: {
      authorization: `App ${apiKey}`,
      "content-type": "application/json",
      accept: "application/json"
    },
    body: JSON.stringify({
      messages: [
        {
          from: sender,
          destinations: [{ to }],
          text: message
        }
      ]
    })
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.requestError?.serviceException?.text ?? "Infobip SMS send failed.");
  }

  const result = payload.messages?.[0] ?? {};
  return {
    provider: "infobip",
    providerMessageId: result.messageId,
    status: result.status?.groupName ?? "submitted",
    raw: payload
  };
}

const PROVIDERS = {
  twilio: sendWithTwilio,
  "africas-talking": sendWithAfricasTalking,
  infobip: sendWithInfobip
};

export async function sendSmsWithFailover({ to, message, providerOrder = ["twilio", "africas-talking", "infobip"], fetchImpl = fetch }) {
  const errors = [];

  for (const provider of providerOrder) {
    const sender = PROVIDERS[provider];
    if (!sender) continue;

    try {
      return await sender({ to, message, fetchImpl });
    } catch (error) {
      errors.push({
        provider,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  const failure = new Error("All SMS providers failed.");
  failure.providerErrors = errors;
  throw failure;
}
