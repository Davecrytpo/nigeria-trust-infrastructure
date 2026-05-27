import type {
  ArtisanProfile,
  PeerAttestation,
  WorkProof,
  WorkProofMedia,
} from './trust.types';

export const TRUST_REPOSITORY = Symbol('TRUST_REPOSITORY');

export interface TrustRepository {
  listProfiles(): Promise<ArtisanProfile[]>;
  getProfile(artisanId: string): Promise<ArtisanProfile | undefined>;
  findProfileByHandle(handle: string): Promise<ArtisanProfile | undefined>;
  saveProfile(profile: ArtisanProfile): Promise<void>;
  listWorkProofs(artisanId: string): Promise<WorkProof[]>;
  saveWorkProof(proof: WorkProof): Promise<void>;
  countWorkProofs(): Promise<number>;
  listAttestations(artisanId: string): Promise<PeerAttestation[]>;
  saveAttestation(attestation: PeerAttestation): Promise<void>;
  countAttestations(): Promise<number>;
  getWorkProof(proofId: string): Promise<WorkProof | undefined>;
  saveWorkProofMedia(media: WorkProofMedia): Promise<void>;
  listWorkProofMedia(proofId: string): Promise<WorkProofMedia[]>;
}
