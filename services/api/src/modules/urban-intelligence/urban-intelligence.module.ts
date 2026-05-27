import { Module } from '@nestjs/common';
import { UrbanIntelligenceService } from './urban-intelligence.service';
import { InfrastructureAnalyticsService } from './infrastructure-analytics.service';
import { GovernanceService } from './governance.service';

@Module({
  providers: [
    UrbanIntelligenceService,
    InfrastructureAnalyticsService,
    GovernanceService,
  ],
  exports: [
    UrbanIntelligenceService,
    InfrastructureAnalyticsService,
    GovernanceService,
  ],
})
export class UrbanIntelligenceModule {}
