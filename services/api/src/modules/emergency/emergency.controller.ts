import { Body, Controller, Get, Param, Post, Put, Sse } from '@nestjs/common';
import { EmergencyService } from './emergency.service';
import { HumanService } from '../human/human.service';
import { Incident } from '@shared/domain';

@Controller('emergency')
export class EmergencyController {
  constructor(
    private readonly emergencyService: EmergencyService,
    private readonly humanService: HumanService,
  ) {}

  @Post('detect')
  async detect(@Body() data: Partial<Incident>) {
    return this.emergencyService.detectIncident(data);
  }

  @Get('incidents/:id/nearby-responders')
  async getNearbyResponders(@Param('id') id: string) {
    const incident = await this.emergencyService.getIncident(id);
    if (!incident || !incident.location) return [];

    return this.humanService.findNearbyResponders(
      incident.location.lat,
      incident.location.lng,
    );
  }

  @Get('incidents')
  async list() {
    return this.emergencyService.listIncidents();
  }

  @Sse('events')
  events() {
    return this.emergencyService.incidentEvents();
  }

  @Get('incidents/:id')
  async get(@Param('id') id: string) {
    return this.emergencyService.getIncident(id);
  }

  @Put('incidents/:id/escalate')
  async escalate(@Param('id') id: string) {
    return this.emergencyService.escalateIncident(id);
  }

  @Put('incidents/:id/track')
  async track(@Param('id') id: string) {
    return this.emergencyService.trackResponse(id);
  }

  @Post('incidents/:id/coercion')
  async coercion(
    @Param('id') id: string,
    @Body() data: { coercion_flag?: boolean; status?: string; source?: string },
  ) {
    return this.emergencyService.reportCoercion(id, data);
  }

  @Put('incidents/:id/resolve')
  async resolve(@Param('id') id: string) {
    return this.emergencyService.resolveIncident(id);
  }
}
