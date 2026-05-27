export const IncidentStage = Object.freeze({
  DETECTION: "DETECTION",
  DATA_COLLECTION: "DATA_COLLECTION",
  VALIDATION: "VALIDATION",
  LOCAL_COORDINATION: "LOCAL_COORDINATION",
  ESCALATION: "ESCALATION",
  RESPONSE_TRACKING: "RESPONSE_TRACKING",
  RESOLUTION: "RESOLUTION",
});

export const EntryMethod = Object.freeze({
  APP: "APP",
  SMS: "SMS",
  SILENT_PANIC: "SILENT_PANIC",
  VOICE: "VOICE",
  COMMUNITY: "COMMUNITY",
});

export const IncidentType = Object.freeze({
  FIRE: "FIRE",
  MEDICAL: "MEDICAL",
  KIDNAP: "KIDNAP",
  ROBBERY: "ROBBERY",
  HELP: "HELP",
});

export const Severity = Object.freeze({
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
});

export const PILOT_NEIGHBORHOOD = {
  id: "yaba-tejuosho-axis",
  name: "Yaba Pilot - Tejuosho Axis",
  city: "Lagos",
  state: "Lagos",
  coverageNote:
    "Pilot coverage is currently limited to the Tejuosho, Sabo, and Commercial Avenue corridor.",
};

export const SMS_KEYWORDS = {
  FIRE: IncidentType.FIRE,
  HELP: IncidentType.HELP,
  MEDICAL: IncidentType.MEDICAL,
  KIDNAP: IncidentType.KIDNAP,
  ROBBERY: IncidentType.ROBBERY,
};

export const INCIDENT_TYPES = [
  { id: "medical", label: "Medical emergency", mapsTo: IncidentType.MEDICAL },
  { id: "security", label: "Security threat", mapsTo: IncidentType.ROBBERY },
  { id: "fire", label: "Fire emergency", mapsTo: IncidentType.FIRE },
  { id: "help", label: "General help", mapsTo: IncidentType.HELP },
];

export const SEVERITY_OPTIONS = [
  { id: "moderate", label: "Moderate", mapsTo: Severity.MEDIUM },
  { id: "high", label: "High", mapsTo: Severity.HIGH },
  { id: "critical", label: "Critical", mapsTo: Severity.CRITICAL },
];

export const RESPONDER_TYPES = [
  { id: "community", label: "Community responder" },
  { id: "medical", label: "Medical responder" },
  { id: "security", label: "Security responder" },
  { id: "fire", label: "Fire responder" },
];

export const INCIDENT_STATUSES = [
  { id: "awaiting-response", label: "Awaiting response" },
  { id: "dispatching", label: "Dispatching" },
  { id: "resolved", label: "Resolved" },
];

export const RESPONDER_TIERS = {
  TIER_1_COMMUNITY: "Verified Community Responder",
  TIER_2_INSTITUTIONAL: "Institutional Responder",
};

export const ArtisanTrade = Object.freeze({
  ELECTRICIAN: "ELECTRICIAN",
  PLUMBER: "PLUMBER",
  AC_TECHNICIAN: "AC_TECHNICIAN",
  CARPENTER: "CARPENTER",
  PAINTER: "PAINTER",
  MECHANIC: "MECHANIC",
});

export const EkoTrustVerificationLevel = Object.freeze({
  BRONZE: "BRONZE",
  SILVER: "SILVER",
  GOLD: "GOLD",
  PLATINUM: "PLATINUM",
});

export const WorkProofStatus = Object.freeze({
  PENDING_AI_REVIEW: "PENDING_AI_REVIEW",
  AI_PASSED: "AI_PASSED",
  PEER_CONFIRMED: "PEER_CONFIRMED",
  FLAGGED: "FLAGGED",
});

export const AttestationDecision = Object.freeze({
  APPROVE: "APPROVE",
  REJECT: "REJECT",
  FLAG: "FLAG",
});

export function getIncidentType(id) {
  return INCIDENT_TYPES.find((item) => item.id === id) ?? INCIDENT_TYPES[0];
}

export function getResponderType(id) {
  return RESPONDER_TYPES.find((item) => item.id === id) ?? RESPONDER_TYPES[0];
}

export function getStatus(id) {
  return (
    INCIDENT_STATUSES.find((item) => item.id === id) ?? INCIDENT_STATUSES[0]
  );
}

export function formatRelativeTime(value) {
  const timestamp = new Date(value).getTime();
  const elapsedSeconds = Math.max(
    0,
    Math.floor((Date.now() - timestamp) / 1000),
  );

  if (elapsedSeconds < 60) return `${elapsedSeconds}s ago`;

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours}h ago`;

  const elapsedDays = Math.floor(elapsedHours / 24);
  return `${elapsedDays}d ago`;
}
