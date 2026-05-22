import { Module } from '@nestjs/common';
import { EmergencyController } from './emergency.controller';
import { EmergencyService } from './emergency.service';
import { HumanModule } from '../human/human.module';
import { TrustModule } from '../trust/trust.module';
import { ReliabilityService } from './reliability.service';
import { ReplayService } from './replay.service';
import { SmsGatewayService } from './sms-gateway/sms-gateway.service';
import { SmsGatewayController } from './sms-gateway/sms-gateway.controller';
import { SeverityEngineService } from './severity-engine.service';
import { DisasterModeService } from './disaster-mode.service';

@Module({
  imports: [HumanModule, TrustModule],
  controllers: [EmergencyController, SmsGatewayController],
  providers: [
    EmergencyService, 
    ReliabilityService, 
    ReplayService, 
    SmsGatewayService,
    SeverityEngineService,
    DisasterModeService,
  ],
  exports: [EmergencyService, ReliabilityService, ReplayService, SeverityEngineService, DisasterModeService],
})
export class EmergencyModule {}
