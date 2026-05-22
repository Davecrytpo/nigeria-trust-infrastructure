import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { TrustModule } from './modules/trust/trust.module';
import { HumanModule } from './modules/human/human.module';
import { AddressModule } from './modules/address/address.module';
import { CommunityModule } from './modules/community/community.module';
import { EmergencyModule } from './modules/emergency/emergency.module';
import { UrbanIntelligenceModule } from './modules/urban-intelligence/urban-intelligence.module';

@Module({
  imports: [
    ServeStaticModule.forRoot(
      {
        rootPath: join(__dirname, '../../../../apps/ops-console'),
        serveRoot: '/ops',
      },
      {
        rootPath: join(__dirname, '../../../../apps/resident-pwa'),
        serveRoot: '/',
      },
    ),
    TrustModule,
    HumanModule,
    AddressModule,
    CommunityModule,
    EmergencyModule,
    UrbanIntelligenceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
