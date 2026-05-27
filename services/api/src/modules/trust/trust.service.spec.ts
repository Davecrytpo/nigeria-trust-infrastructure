import { Test, TestingModule } from '@nestjs/testing';
import { InMemoryTrustRepository } from './in-memory-trust.repository';
import { SupabaseStorageService } from './supabase-storage.service';
import { TRUST_REPOSITORY } from './trust.repository';
import {
  AttestationDecision,
  CreateMediaUploadIntentInput,
  TrustService,
  WorkProofStatus,
} from './trust.service';

describe('TrustService', () => {
  let service: TrustService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrustService,
        InMemoryTrustRepository,
        {
          provide: TRUST_REPOSITORY,
          useExisting: InMemoryTrustRepository,
        },
        {
          provide: SupabaseStorageService,
          useValue: {
            buildStorageKey: jest.fn((input: CreateMediaUploadIntentInput) => {
              return `work-proofs/${input.proofId}/${input.mediaRole}/hash.jpg`;
            }),
            createSignedUploadIntent: jest.fn(
              (input: CreateMediaUploadIntentInput, storageKey: string) => ({
                provider: 'supabase',
                bucket: 'ekotrust-work-proofs',
                storageKey,
                uploadUrl:
                  'https://example.supabase.co/storage/upload/sign/hash',
                headers: { 'content-type': input.contentType },
                expiresInSeconds: 900,
              }),
            ),
          },
        },
      ],
    }).compile();

    service = module.get<TrustService>(TrustService);
  });

  it('returns the seeded artisan profile and trust score', async () => {
    const [profile] = await service.listProfiles();
    const score = await service.getTrustScore(profile.id);

    expect(profile.fullName).toBe('Chinedu Okafor');
    expect(profile.publicHandle).toContain('ekotrust.ng');
    expect(score.score).toBe(profile.trustScore);
    expect(score.signals.identityConfidence).toBeGreaterThan(80);
  });

  it('queues visual proof of work for AI review', async () => {
    const [profile] = await service.listProfiles();
    const proof = await service.createWorkProof({
      artisanId: profile.id,
      title: 'Panel replacement',
      category: 'Electrical repair',
      location: 'Yaba',
      beforeMediaCount: 2,
      afterMediaCount: 3,
    });

    expect(proof.status).toBe(WorkProofStatus.PENDING_AI_REVIEW);
    expect(proof.aiReview.imageQuality).toBeGreaterThan(80);
    await expect(service.listWorkProofs(profile.id)).resolves.toContainEqual(
      proof,
    );
  });

  it('records peer attestations and keeps trust score bounded', async () => {
    const [profile] = await service.listProfiles();
    const attestation = await service.createAttestation({
      artisanId: profile.id,
      attesterName: 'Amina Bello',
      relationship: 'Customer',
      decision: AttestationDecision.APPROVE,
      note: 'Completed the job cleanly.',
    });
    const score = await service.getTrustScore(profile.id);

    expect(attestation.decision).toBe(AttestationDecision.APPROVE);
    expect(score.score).toBeGreaterThanOrEqual(0);
    expect(score.score).toBeLessThanOrEqual(100);
  });

  it('creates upload intents and registers proof media metadata', async () => {
    const [profile] = await service.listProfiles();
    const [proof] = await service.listWorkProofs(profile.id);
    const intent = await service.createMediaUploadIntent({
      proofId: proof.id,
      mediaRole: 'before',
      mediaType: 'image',
      fileName: 'before-panel.jpg',
      contentType: 'image/jpeg',
      byteSize: 2048,
      contentHash: 'abc123def456',
    });
    const media = await service.registerWorkProofMedia({
      proofId: proof.id,
      mediaRole: 'before',
      mediaType: 'image',
      storageKey: intent.storageKey,
      contentHash: 'abc123def456',
      byteSize: 2048,
      width: 1080,
      height: 1440,
    });

    expect(intent.provider).toBe('supabase');
    expect(media.storageKey).toBe(intent.storageKey);
    await expect(service.listWorkProofMedia(proof.id)).resolves.toContainEqual(
      media,
    );
  });
});
