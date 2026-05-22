import { Injectable, Logger } from '@nestjs/common';
import { Incident, IncidentStage, EntryMethod, IncidentType, Severity } from '@shared/domain';
import { ReliabilityService } from './reliability.service';
import { ReplayService } from './replay.service';

@Injectable()
export class EmergencyService {
  private readonly logger = new Logger(EmergencyService.name);
  private incidents: Map<string, Incident> = new Map();

  constructor(
    private readonly reliabilityService: ReliabilityService,
    private readonly replayService: ReplayService,
  ) {}

  /**
   * Stage 1: Incident Detection
   */
  async detectIncident(data: Partial<Incident>): Promise<Incident> {
    const startTime = Date.now();
    const id = Math.random().toString(36).substring(7);
    const incident: Incident = {
      id,
      requesterId: data.requesterId || 'anonymous',
      type: data.type || IncidentType.HELP,
      entryMethod: data.entryMethod || EntryMethod.APP,
      severity: data.severity || Severity.MEDIUM,
      stage: IncidentStage.DETECTION,
      createdAt: new Date(),
      ...data,
    };

    this.incidents.set(id, incident);
    this.logger.log(`Incident ${id} detected via ${incident.entryMethod}`);
    
    await this.replayService.captureEvent(id, 'INCIDENT_DETECTED', { entryMethod: incident.entryMethod });
    await this.reliabilityService.logTelemetry(id, 'DETECTION', Date.now() - startTime, { source: incident.entryMethod });

    // Automatically transition to Data Collection
    return this.collectData(id);
  }

  /**
   * Stage 2: Data Collection
   */
  async collectData(id: string): Promise<Incident> {
    const startTime = Date.now();
    const incident = this.incidents.get(id);
    if (!incident) throw new Error('Incident not found');

    incident.stage = IncidentStage.DATA_COLLECTION;
    
    await this.replayService.captureEvent(id, 'DATA_COLLECTION_STARTED', {});
    await this.reliabilityService.logTelemetry(id, 'DATA_COLLECTION', Date.now() - startTime, {});

    return this.validateIncident(id);
  }

  /**
   * Stage 3: Incident Validation
   */
  async validateIncident(id: string): Promise<Incident> {
    const startTime = Date.now();
    const incident = this.incidents.get(id);
    if (!incident) throw new Error('Incident not found');

    incident.stage = IncidentStage.VALIDATION;
    
    await this.replayService.captureEvent(id, 'VALIDATION_COMPLETED', { result: 'AUTHENTIC' });
    await this.reliabilityService.logTelemetry(id, 'VALIDATION', Date.now() - startTime, {});

    return this.coordinateLocalResponse(id);
  }

  /**
   * Stage 4: Local Coordination
   */
  async coordinateLocalResponse(id: string): Promise<Incident> {
    const startTime = Date.now();
    const incident = this.incidents.get(id);
    if (!incident) throw new Error('Incident not found');

    incident.stage = IncidentStage.LOCAL_COORDINATION;
    
    await this.replayService.captureEvent(id, 'LOCAL_COORDINATION_STARTED', {});
    await this.reliabilityService.logTelemetry(id, 'LOCAL_COORDINATION', Date.now() - startTime, {});

    return incident;
  }

  /**
   * Stage 5: Escalation
   */
  async escalateIncident(id: string): Promise<Incident> {
    const incident = this.incidents.get(id);
    if (!incident) throw new Error('Incident not found');

    incident.stage = IncidentStage.ESCALATION;
    this.logger.log(`Incident ${id} Escalated to institutional responders`);

    return incident;
  }

  /**
   * Stage 6: Response Tracking
   */
  async trackResponse(id: string): Promise<Incident> {
    const incident = this.incidents.get(id);
    if (!incident) throw new Error('Incident not found');

    incident.stage = IncidentStage.RESPONSE_TRACKING;
    this.logger.log(`Incident ${id} is now being tracked`);

    return incident;
  }

  /**
   * Stage 7: Resolution
   */
  async resolveIncident(id: string): Promise<Incident> {
    const incident = this.incidents.get(id);
    if (!incident) throw new Error('Incident not found');

    incident.stage = IncidentStage.RESOLUTION;
    incident.closedAt = new Date();
    this.logger.log(`Incident ${id} Resolved`);

    return incident;
  }

  async getIncident(id: string): Promise<Incident | undefined> {
    return this.incidents.get(id);
  }

  async listIncidents(): Promise<Incident[]> {
    return Array.from(this.incidents.values());
  }
}
