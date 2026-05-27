import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { TrustService } from './trust.service';
import type {
  CreateAttestationInput,
  CreateMediaUploadIntentInput,
  CreateWorkProofInput,
  RegisterWorkProofMediaInput,
} from './trust.service';

@Controller('trust')
export class TrustController {
  constructor(private readonly trustService: TrustService) {}

  @Get('profiles')
  async listProfiles() {
    return this.trustService.listProfiles();
  }

  @Get('profiles/:artisanId')
  async getProfile(@Param('artisanId') artisanId: string) {
    return this.trustService.getProfile(artisanId);
  }

  @Get('public/:handle')
  async getPublicProfile(@Param('handle') handle: string) {
    return this.trustService.getPublicProfile(handle);
  }

  @Get('profiles/:artisanId/score')
  async getTrustScore(@Param('artisanId') artisanId: string) {
    return this.trustService.getTrustScore(artisanId);
  }

  @Get('profiles/:artisanId/proofs')
  async listWorkProofs(@Param('artisanId') artisanId: string) {
    return this.trustService.listWorkProofs(artisanId);
  }

  @Post('proofs')
  async createWorkProof(@Body() body: CreateWorkProofInput) {
    return this.trustService.createWorkProof(body);
  }

  @Post('media/upload-intents')
  async createMediaUploadIntent(@Body() body: CreateMediaUploadIntentInput) {
    return this.trustService.createMediaUploadIntent(body);
  }

  @Post('media')
  async registerWorkProofMedia(@Body() body: RegisterWorkProofMediaInput) {
    return this.trustService.registerWorkProofMedia(body);
  }

  @Get('proofs/:proofId/media')
  async listWorkProofMedia(@Param('proofId') proofId: string) {
    return this.trustService.listWorkProofMedia(proofId);
  }

  @Get('profiles/:artisanId/attestations')
  async listAttestations(@Param('artisanId') artisanId: string) {
    return this.trustService.listAttestations(artisanId);
  }

  @Post('attestations')
  async createAttestation(@Body() body: CreateAttestationInput) {
    return this.trustService.createAttestation(body);
  }
}
