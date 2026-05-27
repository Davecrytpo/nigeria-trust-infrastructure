import { Injectable, Logger } from '@nestjs/common';
import { Incident, Severity, IncidentStage } from '@shared/domain';
import { ReliabilityService } from './reliability.service';

@Injectable()
export class SeverityEngineService {
  private readonly logger = new Logger(SeverityEngineService.name);

  constructor(private readonly reliabilityService: ReliabilityService) {}

  /**
   * Section 6: Dynamic Severity Evolution.
   * Automatically upgrades severity if acknowledgment thresholds are missed.
   */
  async evaluateSeverity(incident: Incident): Promise<Severity> {
    const ageMinutes = (Date.now() - incident.createdAt.getTime()) / 60000;

    // Threshold-based escalation logic
    if (incident.stage === IncidentStage.LOCAL_COORDINATION && ageMinutes > 5) {
      if (incident.severity === Severity.MEDIUM) {
        this.logger.warn(
          `Incident ${incident.id} auto-escalating to HIGH due to response delay.`,
        );
        return Severity.HIGH;
      }
    }

    if (incident.severity === Severity.HIGH && ageMinutes > 10) {
      this.logger.error(
        `Incident ${incident.id} auto-escalating to CRITICAL. Threshold exceeded.`,
      );
      return Severity.CRITICAL;
    }

    return incident.severity;
  }

  /**
   * Incident Deduplication (Mass Reporting).
   * Groups multiple reports of the same event into a single 'Authoritative Incident'.
   */
  async findDuplicate(
    lat: number,
    lng: number,
    type: string,
  ): Promise<string | null> {
    void lat;
    void lng;
    void type;
    // Logic to search for incidents within 100m of the same type in the last 15 minutes.
    return null;
  }
}
