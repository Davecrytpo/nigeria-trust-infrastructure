import { Module } from '@nestjs/common';
import { InMemoryTrustRepository } from './in-memory-trust.repository';
import { PostgresTrustRepository } from './postgres-trust.repository';
import { SupabaseStorageService } from './supabase-storage.service';
import { TrustController } from './trust.controller';
import { TRUST_REPOSITORY } from './trust.repository';
import { TrustService } from './trust.service';

@Module({
  controllers: [TrustController],
  providers: [
    TrustService,
    SupabaseStorageService,
    InMemoryTrustRepository,
    {
      provide: TRUST_REPOSITORY,
      useFactory: (memoryRepository: InMemoryTrustRepository) => {
        if (process.env.DATABASE_URL) {
          return new PostgresTrustRepository(process.env.DATABASE_URL);
        }
        return memoryRepository;
      },
      inject: [InMemoryTrustRepository],
    },
  ],
  exports: [TrustService],
})
export class TrustModule {}
