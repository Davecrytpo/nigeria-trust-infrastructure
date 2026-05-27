import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import {
  ArtisanTrade,
  AttestationDecision,
  EkoTrustVerificationLevel,
  WorkProofStatus,
} from './trust.types';
import type {
  ArtisanProfile,
  PeerAttestation,
  TrustSignalBreakdown,
  WorkProof,
  WorkProofMedia,
} from './trust.types';
import type { TrustRepository } from './trust.repository';

type ProfileRow = {
  id: string;
  full_name: string;
  phone_number: string;
  trade: ArtisanTrade;
  community: string;
  location: string;
  verification_level: EkoTrustVerificationLevel;
  trust_score: number;
  completion_rate: number;
  verified_jobs: number;
  peer_attestations: number;
  public_handle: string;
  qr_payload: string;
  identity_confidence: number;
  peer_validation: number;
  customer_reviews: number;
  work_consistency: number;
  activity_history: number;
  fraud_confidence: number;
};

type ProofRow = {
  id: string;
  artisan_id: string;
  title: string;
  category: string;
  location: string;
  before_media_count: number;
  after_media_count: number;
  status: WorkProofStatus;
  image_quality: number;
  duplicate_risk: number;
  fraud_risk: number;
  category_confidence: number;
  created_at: Date;
};

type AttestationRow = {
  id: string;
  artisan_id: string;
  proof_id?: string;
  attester_name: string;
  relationship: string;
  decision: AttestationDecision;
  note?: string;
  created_at: Date;
};

type MediaRow = {
  id: string;
  proof_id: string;
  media_role: 'before' | 'after' | 'supporting';
  media_type: 'image' | 'video';
  storage_provider: 'supabase';
  storage_key: string;
  content_hash: string;
  byte_size: number;
  width?: number;
  height?: number;
  duration_ms?: number;
  uploaded_at: Date;
};

@Injectable()
export class PostgresTrustRepository
  implements TrustRepository, OnModuleDestroy
{
  private readonly pool: Pool;

  constructor(connectionString = process.env.DATABASE_URL) {
    if (!connectionString) {
      throw new Error('DATABASE_URL is required for PostgresTrustRepository.');
    }
    this.pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  async listProfiles(): Promise<ArtisanProfile[]> {
    const result = await this.pool.query<ProfileRow>(
      'SELECT * FROM artisan_profiles ORDER BY trust_score DESC, created_at ASC',
    );
    return result.rows.map(mapProfile);
  }

  async getProfile(artisanId: string): Promise<ArtisanProfile | undefined> {
    const result = await this.pool.query<ProfileRow>(
      'SELECT * FROM artisan_profiles WHERE id::text = $1 OR public_handle = $1 LIMIT 1',
      [artisanId],
    );
    return result.rows[0] ? mapProfile(result.rows[0]) : undefined;
  }

  async findProfileByHandle(
    handle: string,
  ): Promise<ArtisanProfile | undefined> {
    const normalized = handle.replace(/^@/, '').toLowerCase();
    const result = await this.pool.query<ProfileRow>(
      'SELECT * FROM artisan_profiles WHERE lower(public_handle) = $1 OR lower(public_handle) LIKE $2 LIMIT 1',
      [normalized, `%/${normalized}`],
    );
    return result.rows[0] ? mapProfile(result.rows[0]) : undefined;
  }

  async saveProfile(profile: ArtisanProfile): Promise<void> {
    await this.pool.query(
      `
        UPDATE artisan_profiles
        SET verification_level = $2,
            trust_score = $3,
            completion_rate = $4,
            verified_jobs = $5,
            peer_attestations = $6,
            identity_confidence = $7,
            peer_validation = $8,
            customer_reviews = $9,
            work_consistency = $10,
            activity_history = $11,
            fraud_confidence = $12,
            updated_at = now()
        WHERE id::text = $1
      `,
      [
        profile.id,
        profile.verificationLevel,
        profile.trustScore,
        profile.completionRate,
        profile.verifiedJobs,
        profile.peerAttestations,
        profile.signals.identityConfidence,
        profile.signals.peerValidation,
        profile.signals.customerReviews,
        profile.signals.workConsistency,
        profile.signals.activityHistory,
        profile.signals.fraudConfidence,
      ],
    );
  }

  async listWorkProofs(artisanId: string): Promise<WorkProof[]> {
    const result = await this.pool.query<ProofRow>(
      'SELECT * FROM work_proofs WHERE artisan_id::text = $1 ORDER BY created_at DESC',
      [artisanId],
    );
    return result.rows.map(mapProof);
  }

  async saveWorkProof(proof: WorkProof): Promise<void> {
    await this.pool.query(
      `
        INSERT INTO work_proofs (
          id,
          artisan_id,
          title,
          category,
          location,
          before_media_count,
          after_media_count,
          status,
          image_quality,
          duplicate_risk,
          fraud_risk,
          category_confidence
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      `,
      [
        proof.id,
        proof.artisanId,
        proof.title,
        proof.category,
        proof.location,
        proof.beforeMediaCount,
        proof.afterMediaCount,
        proof.status,
        proof.aiReview.imageQuality,
        proof.aiReview.duplicateRisk,
        proof.aiReview.fraudRisk,
        proof.aiReview.categoryConfidence,
      ],
    );
  }

  async countWorkProofs(): Promise<number> {
    const result = await this.pool.query<{ count: string }>(
      'SELECT COUNT(*) AS count FROM work_proofs',
    );
    return Number(result.rows[0]?.count ?? 0);
  }

  async listAttestations(artisanId: string): Promise<PeerAttestation[]> {
    const result = await this.pool.query<AttestationRow>(
      'SELECT * FROM peer_attestations WHERE artisan_id::text = $1 ORDER BY created_at DESC',
      [artisanId],
    );
    return result.rows.map(mapAttestation);
  }

  async saveAttestation(attestation: PeerAttestation): Promise<void> {
    await this.pool.query(
      `
        INSERT INTO peer_attestations (
          id,
          artisan_id,
          proof_id,
          attester_name,
          relationship,
          decision,
          note
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7)
      `,
      [
        attestation.id,
        attestation.artisanId,
        attestation.proofId ?? null,
        attestation.attesterName,
        attestation.relationship,
        attestation.decision,
        attestation.note ?? null,
      ],
    );
  }

  async countAttestations(): Promise<number> {
    const result = await this.pool.query<{ count: string }>(
      'SELECT COUNT(*) AS count FROM peer_attestations',
    );
    return Number(result.rows[0]?.count ?? 0);
  }

  async getWorkProof(proofId: string): Promise<WorkProof | undefined> {
    const result = await this.pool.query<ProofRow>(
      'SELECT * FROM work_proofs WHERE id::text = $1 LIMIT 1',
      [proofId],
    );
    return result.rows[0] ? mapProof(result.rows[0]) : undefined;
  }

  async saveWorkProofMedia(media: WorkProofMedia): Promise<void> {
    await this.pool.query(
      `
        INSERT INTO work_proof_media (
          id,
          proof_id,
          media_role,
          media_type,
          storage_provider,
          storage_key,
          content_hash,
          byte_size,
          width,
          height,
          duration_ms
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        ON CONFLICT (content_hash, proof_id) DO NOTHING
      `,
      [
        media.id,
        media.proofId,
        media.mediaRole,
        media.mediaType,
        media.storageProvider,
        media.storageKey,
        media.contentHash,
        media.byteSize,
        media.width ?? null,
        media.height ?? null,
        media.durationMs ?? null,
      ],
    );
  }

  async listWorkProofMedia(proofId: string): Promise<WorkProofMedia[]> {
    const result = await this.pool.query<MediaRow>(
      'SELECT * FROM work_proof_media WHERE proof_id::text = $1 ORDER BY uploaded_at DESC',
      [proofId],
    );
    return result.rows.map(mapMedia);
  }
}

function mapProfile(row: ProfileRow): ArtisanProfile {
  const signals: TrustSignalBreakdown = {
    identityConfidence: row.identity_confidence,
    peerValidation: row.peer_validation,
    customerReviews: row.customer_reviews,
    workConsistency: row.work_consistency,
    completionRate: row.completion_rate,
    activityHistory: row.activity_history,
    fraudConfidence: row.fraud_confidence,
  };
  return {
    id: row.id,
    fullName: row.full_name,
    phoneNumber: row.phone_number,
    trade: row.trade,
    community: row.community,
    location: row.location,
    verificationLevel: row.verification_level,
    trustScore: row.trust_score,
    completionRate: row.completion_rate,
    verifiedJobs: row.verified_jobs,
    peerAttestations: row.peer_attestations,
    publicHandle: row.public_handle,
    qrPayload: row.qr_payload,
    signals,
  };
}

function mapProof(row: ProofRow): WorkProof {
  return {
    id: row.id,
    artisanId: row.artisan_id,
    title: row.title,
    category: row.category,
    location: row.location,
    beforeMediaCount: row.before_media_count,
    afterMediaCount: row.after_media_count,
    status: row.status,
    aiReview: {
      imageQuality: row.image_quality,
      duplicateRisk: row.duplicate_risk,
      fraudRisk: row.fraud_risk,
      categoryConfidence: row.category_confidence,
    },
    createdAt: row.created_at.toISOString(),
  };
}

function mapAttestation(row: AttestationRow): PeerAttestation {
  return {
    id: row.id,
    artisanId: row.artisan_id,
    proofId: row.proof_id,
    attesterName: row.attester_name,
    relationship: row.relationship,
    decision: row.decision,
    note: row.note,
    createdAt: row.created_at.toISOString(),
  };
}

function mapMedia(row: MediaRow): WorkProofMedia {
  return {
    id: row.id,
    proofId: row.proof_id,
    mediaRole: row.media_role,
    mediaType: row.media_type,
    storageProvider: row.storage_provider,
    storageKey: row.storage_key,
    contentHash: row.content_hash,
    byteSize: row.byte_size,
    width: row.width,
    height: row.height,
    durationMs: row.duration_ms,
    uploadedAt: row.uploaded_at.toISOString(),
  };
}
