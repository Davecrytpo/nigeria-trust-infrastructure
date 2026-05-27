import { Injectable } from '@nestjs/common';
import {
  ArtisanTrade,
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

@Injectable()
export class InMemoryTrustRepository implements TrustRepository {
  private readonly profiles = new Map<string, ArtisanProfile>();
  private readonly proofs = new Map<string, WorkProof>();
  private readonly attestations = new Map<string, PeerAttestation>();
  private readonly media = new Map<string, WorkProofMedia>();

  constructor() {
    const signals: TrustSignalBreakdown = {
      identityConfidence: 92,
      peerValidation: 88,
      customerReviews: 90,
      workConsistency: 86,
      completionRate: 96,
      activityHistory: 82,
      fraudConfidence: 94,
    };
    const seedProfile: ArtisanProfile = {
      id: 'art-yaba-electrician-001',
      fullName: 'Chinedu Okafor',
      phoneNumber: '+2348011112222',
      trade: ArtisanTrade.ELECTRICIAN,
      community: 'Yaba Artisan Circle',
      location: 'Lagos Mainland',
      verificationLevel: EkoTrustVerificationLevel.GOLD,
      trustScore: 86,
      completionRate: 96,
      verifiedJobs: 47,
      peerAttestations: 18,
      publicHandle: 'ekotrust.ng/chinedu-okafor',
      qrPayload: 'https://ekotrust.ng/chinedu-okafor',
      signals,
    };

    this.profiles.set(seedProfile.id, seedProfile);
    for (const proof of this.seedProofs(seedProfile.id))
      this.proofs.set(proof.id, proof);
  }

  async listProfiles(): Promise<ArtisanProfile[]> {
    return [...this.profiles.values()];
  }

  async getProfile(artisanId: string): Promise<ArtisanProfile | undefined> {
    return this.profiles.get(artisanId);
  }

  async findProfileByHandle(
    handle: string,
  ): Promise<ArtisanProfile | undefined> {
    const normalized = handle.replace(/^@/, '').toLowerCase();
    return [...this.profiles.values()].find((item) =>
      item.publicHandle.toLowerCase().endsWith(normalized),
    );
  }

  async saveProfile(profile: ArtisanProfile): Promise<void> {
    this.profiles.set(profile.id, profile);
  }

  async listWorkProofs(artisanId: string): Promise<WorkProof[]> {
    return [...this.proofs.values()].filter(
      (proof) => proof.artisanId === artisanId,
    );
  }

  async saveWorkProof(proof: WorkProof): Promise<void> {
    this.proofs.set(proof.id, proof);
  }

  async countWorkProofs(): Promise<number> {
    return this.proofs.size;
  }

  async listAttestations(artisanId: string): Promise<PeerAttestation[]> {
    return [...this.attestations.values()].filter(
      (item) => item.artisanId === artisanId,
    );
  }

  async saveAttestation(attestation: PeerAttestation): Promise<void> {
    this.attestations.set(attestation.id, attestation);
  }

  async countAttestations(): Promise<number> {
    return this.attestations.size;
  }

  async getWorkProof(proofId: string): Promise<WorkProof | undefined> {
    return this.proofs.get(proofId);
  }

  async saveWorkProofMedia(media: WorkProofMedia): Promise<void> {
    this.media.set(media.id, media);
  }

  async listWorkProofMedia(proofId: string): Promise<WorkProofMedia[]> {
    return [...this.media.values()].filter((item) => item.proofId === proofId);
  }

  private seedProofs(artisanId: string): WorkProof[] {
    return [
      {
        id: 'proof-001',
        artisanId,
        title: 'Lekki apartment rewiring',
        category: 'Electrical repair',
        location: 'Lekki Phase 1',
        beforeMediaCount: 3,
        afterMediaCount: 4,
        status: WorkProofStatus.PEER_CONFIRMED,
        aiReview: {
          imageQuality: 94,
          duplicateRisk: 4,
          fraudRisk: 3,
          categoryConfidence: 91,
        },
        createdAt: new Date('2026-05-20T10:00:00Z').toISOString(),
      },
      {
        id: 'proof-002',
        artisanId,
        title: 'Inverter fault repair',
        category: 'Power systems',
        location: 'Yaba',
        beforeMediaCount: 2,
        afterMediaCount: 2,
        status: WorkProofStatus.AI_PASSED,
        aiReview: {
          imageQuality: 88,
          duplicateRisk: 6,
          fraudRisk: 5,
          categoryConfidence: 89,
        },
        createdAt: new Date('2026-05-22T13:00:00Z').toISOString(),
      },
    ];
  }
}
