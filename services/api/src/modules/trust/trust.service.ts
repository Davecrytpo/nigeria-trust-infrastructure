import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SupabaseStorageService } from './supabase-storage.service';
import { TRUST_REPOSITORY } from './trust.repository';
import type { TrustRepository } from './trust.repository';
import {
  AttestationDecision,
  EkoTrustVerificationLevel,
  WorkProofStatus,
} from './trust.types';
import type {
  ArtisanProfile,
  CreateAttestationInput,
  CreateMediaUploadIntentInput,
  CreateWorkProofInput,
  MediaUploadIntent,
  PeerAttestation,
  RegisterWorkProofMediaInput,
  TrustSignalBreakdown,
  WorkProof,
  WorkProofMedia,
} from './trust.types';

export {
  ArtisanTrade,
  AttestationDecision,
  EkoTrustVerificationLevel,
  WorkProofStatus,
} from './trust.types';
export type {
  ArtisanProfile,
  CreateAttestationInput,
  CreateMediaUploadIntentInput,
  CreateWorkProofInput,
  MediaUploadIntent,
  PeerAttestation,
  RegisterWorkProofMediaInput,
  TrustSignalBreakdown,
  WorkProof,
  WorkProofMedia,
} from './trust.types';

@Injectable()
export class TrustService {
  constructor(
    @Inject(TRUST_REPOSITORY)
    private readonly repository: TrustRepository,
    private readonly storage: SupabaseStorageService,
  ) {}

  async listProfiles(): Promise<ArtisanProfile[]> {
    return this.repository.listProfiles();
  }

  async getProfile(artisanId: string): Promise<ArtisanProfile> {
    const profile = await this.repository.getProfile(artisanId);
    if (!profile) {
      throw new NotFoundException(`Artisan ${artisanId} was not found`);
    }
    return profile;
  }

  async getPublicProfile(handle: string): Promise<ArtisanProfile> {
    const profile = await this.repository.findProfileByHandle(handle);
    if (!profile) {
      throw new NotFoundException(`Public profile ${handle} was not found`);
    }
    return profile;
  }

  async listWorkProofs(artisanId: string): Promise<WorkProof[]> {
    await this.getProfile(artisanId);
    return this.repository.listWorkProofs(artisanId);
  }

  async createWorkProof(input: CreateWorkProofInput): Promise<WorkProof> {
    await this.getProfile(input.artisanId);
    const proof: WorkProof = {
      id: randomUUID(),
      artisanId: input.artisanId,
      title: input.title,
      category: input.category,
      location: input.location,
      beforeMediaCount: input.beforeMediaCount ?? 0,
      afterMediaCount: input.afterMediaCount ?? 0,
      status: WorkProofStatus.PENDING_AI_REVIEW,
      aiReview: this.estimateAiReview(
        input.beforeMediaCount ?? 0,
        input.afterMediaCount ?? 0,
      ),
      createdAt: new Date().toISOString(),
    };
    await this.repository.saveWorkProof(proof);
    await this.recalculateProfileScore(input.artisanId);
    return proof;
  }

  async listAttestations(artisanId: string): Promise<PeerAttestation[]> {
    await this.getProfile(artisanId);
    return this.repository.listAttestations(artisanId);
  }

  async createAttestation(
    input: CreateAttestationInput,
  ): Promise<PeerAttestation> {
    await this.getProfile(input.artisanId);
    const attestation: PeerAttestation = {
      id: randomUUID(),
      artisanId: input.artisanId,
      proofId: input.proofId,
      attesterName: input.attesterName,
      relationship: input.relationship,
      decision: input.decision,
      note: input.note,
      createdAt: new Date().toISOString(),
    };
    await this.repository.saveAttestation(attestation);
    await this.recalculateProfileScore(input.artisanId);
    return attestation;
  }

  async getTrustScore(artisanId: string) {
    const profile = await this.getProfile(artisanId);
    return {
      artisanId,
      score: profile.trustScore,
      level: profile.verificationLevel,
      signals: profile.signals,
    };
  }

  async createMediaUploadIntent(
    input: CreateMediaUploadIntentInput,
  ): Promise<MediaUploadIntent> {
    await this.getExistingProof(input.proofId);
    this.validateMediaInput(input.byteSize, input.contentType);
    const storageKey = this.storage.buildStorageKey(input);
    return this.storage.createSignedUploadIntent(input, storageKey);
  }

  async registerWorkProofMedia(
    input: RegisterWorkProofMediaInput,
  ): Promise<WorkProofMedia> {
    await this.getExistingProof(input.proofId);
    const media: WorkProofMedia = {
      id: randomUUID(),
      proofId: input.proofId,
      mediaRole: input.mediaRole,
      mediaType: input.mediaType,
      storageProvider: 'supabase',
      storageKey: input.storageKey,
      contentHash: input.contentHash,
      byteSize: input.byteSize,
      width: input.width,
      height: input.height,
      durationMs: input.durationMs,
      uploadedAt: new Date().toISOString(),
    };
    await this.repository.saveWorkProofMedia(media);
    return media;
  }

  async listWorkProofMedia(proofId: string): Promise<WorkProofMedia[]> {
    await this.getExistingProof(proofId);
    return this.repository.listWorkProofMedia(proofId);
  }

  private async getExistingProof(proofId: string): Promise<WorkProof> {
    const proof = await this.repository.getWorkProof(proofId);
    if (!proof) {
      throw new NotFoundException(`Work proof ${proofId} was not found`);
    }
    return proof;
  }

  private validateMediaInput(byteSize: number, contentType: string) {
    const maxBytes = 25 * 1024 * 1024;
    if (byteSize <= 0 || byteSize > maxBytes) {
      throw new Error('Work proof media must be between 1 byte and 25MB.');
    }
    if (!/^image\/|^video\//.test(contentType)) {
      throw new Error('Work proof media must be an image or video.');
    }
  }

  private estimateAiReview(beforeMediaCount: number, afterMediaCount: number) {
    const evidenceBalance =
      beforeMediaCount > 0 && afterMediaCount > 0 ? 12 : 0;
    const mediaDepth = Math.min(10, (beforeMediaCount + afterMediaCount) * 2);
    return {
      imageQuality: 74 + evidenceBalance + mediaDepth,
      duplicateRisk: Math.max(2, 18 - mediaDepth),
      fraudRisk: Math.max(2, 20 - evidenceBalance - mediaDepth),
      categoryConfidence: 78 + Math.floor(mediaDepth / 2),
    };
  }

  private async recalculateProfileScore(artisanId: string): Promise<void> {
    const profile = await this.getProfile(artisanId);
    const proofs = await this.listWorkProofs(artisanId);
    const attestations = await this.listAttestations(artisanId);
    const approvedAttestations = attestations.filter(
      (item) => item.decision === AttestationDecision.APPROVE,
    ).length;
    const flaggedAttestations = attestations.filter(
      (item) => item.decision === AttestationDecision.FLAG,
    ).length;
    const confirmedProofs = proofs.filter(
      (proof) =>
        proof.status === WorkProofStatus.PEER_CONFIRMED ||
        proof.status === WorkProofStatus.AI_PASSED,
    ).length;

    const signals: TrustSignalBreakdown = {
      ...profile.signals,
      peerValidation: Math.min(
        100,
        70 + approvedAttestations * 4 - flaggedAttestations * 12,
      ),
      workConsistency: Math.min(100, 72 + confirmedProofs * 3),
      activityHistory: Math.min(100, 65 + proofs.length * 4),
      fraudConfidence: Math.max(
        0,
        profile.signals.fraudConfidence - flaggedAttestations * 8,
      ),
    };
    const score = this.calculateWeightedScore(signals);
    const updated: ArtisanProfile = {
      ...profile,
      trustScore: score,
      verificationLevel: this.levelForScore(score),
      peerAttestations: profile.peerAttestations + approvedAttestations,
      signals,
    };
    await this.repository.saveProfile(updated);
  }

  private calculateWeightedScore(signals: TrustSignalBreakdown): number {
    const score =
      signals.identityConfidence * 0.18 +
      signals.peerValidation * 0.16 +
      signals.customerReviews * 0.16 +
      signals.workConsistency * 0.16 +
      signals.completionRate * 0.14 +
      signals.activityHistory * 0.1 +
      signals.fraudConfidence * 0.1;
    return Math.round(score);
  }

  private levelForScore(score: number): EkoTrustVerificationLevel {
    if (score >= 92) return EkoTrustVerificationLevel.PLATINUM;
    if (score >= 80) return EkoTrustVerificationLevel.GOLD;
    if (score >= 65) return EkoTrustVerificationLevel.SILVER;
    return EkoTrustVerificationLevel.BRONZE;
  }
}
