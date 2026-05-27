import { Test, TestingModule } from '@nestjs/testing';
import { InMemoryTrustRepository } from './in-memory-trust.repository';
import { SupabaseStorageService } from './supabase-storage.service';
import { TrustController } from './trust.controller';
import { TRUST_REPOSITORY } from './trust.repository';
import {
  AttestationDecision,
  CreateMediaUploadIntentInput,
  TrustService,
} from './trust.service';

describe('TrustController', () => {
  let controller: TrustController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrustController],
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

    controller = module.get<TrustController>(TrustController);
  });

  it('lists artisan profiles', async () => {
    const profiles = await controller.listProfiles();

    expect(profiles.length).toBeGreaterThan(0);
    expect(profiles[0].trade).toBeDefined();
  });

  it('creates work proof and attestation through the controller', async () => {
    const [profile] = await controller.listProfiles();
    const proof = await controller.createWorkProof({
      artisanId: profile.id,
      title: 'Shop lighting installation',
      category: 'Commercial wiring',
      location: 'Surulere',
      beforeMediaCount: 1,
      afterMediaCount: 2,
    });
    const attestation = await controller.createAttestation({
      artisanId: profile.id,
      proofId: proof.id,
      attesterName: 'Tunde Salami',
      relationship: 'Guild peer',
      decision: AttestationDecision.APPROVE,
    });

    expect(proof.artisanId).toBe(profile.id);
    expect(attestation.proofId).toBe(proof.id);
  });
});
