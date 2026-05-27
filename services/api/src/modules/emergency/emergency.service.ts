import { Injectable, Logger } from '@nestjs/common';
import {
  Incident,
  IncidentStage,
  EntryMethod,
  IncidentType,
  Severity,
} from '@shared/domain';
import { Observable, Subject } from 'rxjs';
import { ReliabilityService } from './reliability.service';
import { ReplayService } from './replay.service';

type IncidentEvent = {
  data: {
    type: string;
    incident: Incident;
    emittedAt: string;
  };
};

@Injectable()
export class EmergencyService {
  private readonly logger = new Logger(EmergencyService.name);
  private incidents: Map<string, Incident> = new Map();
  private readonly events$ = new Subject<IncidentEvent>();

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

    this.incidents.set(incident.id, incident);
    this.emitIncidentEvent('incident.detected', incident);
    this.logger.log(
      `Incident ${incident.id} detected via ${incident.entryMethod}`,
    );

    await this.replayService.captureEvent(incident.id, 'INCIDENT_DETECTED', {
      entryMethod: incident.entryMethod,
    });
    await this.reliabilityService.logTelemetry(
      incident.id,
      'DETECTION',
      Date.now() - startTime,
      { source: incident.entryMethod },
    );

    // Automatically transition to Data Collection
    return this.collectData(incident.id);
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
    await this.reliabilityService.logTelemetry(
      id,
      'DATA_COLLECTION',
      Date.now() - startTime,
      {},
    );

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

    await this.replayService.captureEvent(id, 'VALIDATION_COMPLETED', {
      result: 'AUTHENTIC',
    });
    await this.reliabilityService.logTelemetry(
      id,
      'VALIDATION',
      Date.now() - startTime,
      {},
    );

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
    await this.reliabilityService.logTelemetry(
      id,
      'LOCAL_COORDINATION',
      Date.now() - startTime,
      {},
    );

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
    this.emitIncidentEvent('incident.escalated', incident);

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
    this.emitIncidentEvent('incident.tracking', incident);

    return incident;
  }

  async reportCoercion(
    id: string,
    data: { coercion_flag?: boolean; status?: string; source?: string },
  ): Promise<
    Incident & {
      coercionFlag: boolean;
      coercionStatus?: string;
      coercionSource?: string;
    }
  > {
    const incident = this.incidents.get(id);
    if (!incident) throw new Error('Incident not found');

    incident.stage = IncidentStage.ESCALATION;
    incident.severity = Severity.CRITICAL;
    this.logger.warn(
      `Incident ${id} reported possible coercion from ${data.source || 'unknown source'}`,
    );
    this.emitIncidentEvent('incident.coercion', incident);

    return {
      ...incident,
      coercionFlag: data.coercion_flag ?? true,
      coercionStatus: data.status,
      coercionSource: data.source,
    };
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
    this.emitIncidentEvent('incident.resolved', incident);

    return incident;
  }

  async getIncident(id: string): Promise<Incident | undefined> {
    return this.incidents.get(id);
  }

  async listIncidents(): Promise<Incident[]> {
    return Array.from(this.incidents.values());
  }

  incidentEvents(): Observable<IncidentEvent> {
    return this.events$.asObservable();
  }

  private emitIncidentEvent(type: string, incident: Incident) {
    this.events$.next({
      data: {
        type,
        incident,
        emittedAt: new Date().toISOString(),
      },
    });
  }
}
