export enum ArtisanTrade {
  ELECTRICIAN = 'ELECTRICIAN',
  PLUMBER = 'PLUMBER',
  AC_TECHNICIAN = 'AC_TECHNICIAN',
  CARPENTER = 'CARPENTER',
  PAINTER = 'PAINTER',
  MECHANIC = 'MECHANIC',
}

export enum EkoTrustVerificationLevel {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
}

export enum WorkProofStatus {
  PENDING_AI_REVIEW = 'PENDING_AI_REVIEW',
  AI_PASSED = 'AI_PASSED',
  PEER_CONFIRMED = 'PEER_CONFIRMED',
  FLAGGED = 'FLAGGED',
}

export enum AttestationDecision {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  FLAG = 'FLAG',
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

export interface ArtisanProfile {
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

export interface WorkProof {
  id: string;
  artisanId: string;
  title: string;
  category: string;
  location: string;
  beforeMediaCount: number;
  afterMediaCount: number;
  status: WorkProofStatus;
  aiReview: {
    imageQuality: number;
    duplicateRisk: number;
    fraudRisk: number;
    categoryConfidence: number;
  };
  createdAt: string;
}

export interface PeerAttestation {
  id: string;
  artisanId: string;
  proofId?: string;
  attesterName: string;
  relationship: string;
  decision: AttestationDecision;
  note?: string;
  createdAt: string;
}

export type WorkProofMediaRole = 'before' | 'after' | 'supporting';
export type WorkProofMediaType = 'image' | 'video';

export interface WorkProofMedia {
  id: string;
  proofId: string;
  mediaRole: WorkProofMediaRole;
  mediaType: WorkProofMediaType;
  storageProvider: 'supabase';
  storageKey: string;
  contentHash: string;
  byteSize: number;
  width?: number;
  height?: number;
  durationMs?: number;
  uploadedAt: string;
}

export interface CreateWorkProofInput {
  artisanId: string;
  title: string;
  category: string;
  location: string;
  beforeMediaCount?: number;
  afterMediaCount?: number;
}

export interface CreateAttestationInput {
  artisanId: string;
  proofId?: string;
  attesterName: string;
  relationship: string;
  decision: AttestationDecision;
  note?: string;
}

export interface CreateMediaUploadIntentInput {
  proofId: string;
  mediaRole: WorkProofMediaRole;
  mediaType: WorkProofMediaType;
  fileName: string;
  contentType: string;
  byteSize: number;
  contentHash: string;
}

export interface RegisterWorkProofMediaInput {
  proofId: string;
  mediaRole: WorkProofMediaRole;
  mediaType: WorkProofMediaType;
  storageKey: string;
  contentHash: string;
  byteSize: number;
  width?: number;
  height?: number;
  durationMs?: number;
}

export interface MediaUploadIntent {
  provider: 'supabase';
  bucket: string;
  storageKey: string;
  uploadUrl: string;
  token?: string;
  headers: Record<string, string>;
  expiresInSeconds: number;
}
