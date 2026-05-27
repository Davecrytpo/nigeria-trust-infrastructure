export enum IncidentStage {
  DETECTION = "DETECTION",
  DATA_COLLECTION = "DATA_COLLECTION",
  VALIDATION = "VALIDATION",
  LOCAL_COORDINATION = "LOCAL_COORDINATION",
  ESCALATION = "ESCALATION",
  RESPONSE_TRACKING = "RESPONSE_TRACKING",
  RESOLUTION = "RESOLUTION",
}

export enum EntryMethod {
  APP = "APP",
  SMS = "SMS",
  SILENT_PANIC = "SILENT_PANIC",
  VOICE = "VOICE",
  COMMUNITY = "COMMUNITY",
}

export enum IncidentType {
  FIRE = "FIRE",
  MEDICAL = "MEDICAL",
  KIDNAP = "KIDNAP",
  ROBBERY = "ROBBERY",
  HELP = "HELP",
}

export enum Severity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

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

export function getIncidentType(id: string) {
  return INCIDENT_TYPES.find((item) => item.id === id) ?? INCIDENT_TYPES[0];
}

export function getResponderType(id: string) {
  return RESPONDER_TYPES.find((item) => item.id === id) ?? RESPONDER_TYPES[0];
}

export function getStatus(id: string) {
  return (
    INCIDENT_STATUSES.find((item) => item.id === id) ?? INCIDENT_STATUSES[0]
  );
}

export function formatRelativeTime(value: string | Date) {
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

export interface Incident {
  id: string;
  requesterId: string;
  type: IncidentType;
  entryMethod: EntryMethod;
  severity: Severity;
  stage: IncidentStage;
  location?: {
    lat: number;
    lng: number;
  };
  nearbyLandmarks?: string;
  createdAt: Date;
  closedAt?: Date;
}

export const RESPONDER_TIERS = {
  TIER_1_COMMUNITY: "Verified Community Responder",
  TIER_2_INSTITUTIONAL: "Institutional Responder",
};

export enum ArtisanTrade {
  ELECTRICIAN = "ELECTRICIAN",
  PLUMBER = "PLUMBER",
  AC_TECHNICIAN = "AC_TECHNICIAN",
  CARPENTER = "CARPENTER",
  PAINTER = "PAINTER",
  MECHANIC = "MECHANIC",
}

export enum EkoTrustVerificationLevel {
  BRONZE = "BRONZE",
  SILVER = "SILVER",
  GOLD = "GOLD",
  PLATINUM = "PLATINUM",
}

export enum WorkProofStatus {
  PENDING_AI_REVIEW = "PENDING_AI_REVIEW",
  AI_PASSED = "AI_PASSED",
  PEER_CONFIRMED = "PEER_CONFIRMED",
  FLAGGED = "FLAGGED",
}

export enum AttestationDecision {
  APPROVE = "APPROVE",
  REJECT = "REJECT",
  FLAG = "FLAG",
}

export interface TrustSignalBreakdown {
  identityConfidence: number;
  peerValidation: number;
  customerReviews: number;
  workConsistency: number;
  completionRate: number;
  activityHistory: number;
  fraudConfidence: number;
}

export interface ArtisanTrustProfile {
  id: string;
  fullName: string;
  phoneNumber: string;
  trade: ArtisanTrade;
  community: string;
  location: string;
  verificationLevel: EkoTrustVerificationLevel;
  trustScore: number;
  completionRate: number;
  verifiedJobs: number;
  peerAttestations: number;
  publicHandle: string;
  qrPayload: string;
  signals: TrustSignalBreakdown;
}

export interface VisualProofOfWork {
  id: string;
  artisanId: string;
  title: string;
  category: string;
  location: string;
  beforeMediaCount: number;
  afterMediaCount: number;
  status: WorkProofStatus;
  createdAt: string;
}
