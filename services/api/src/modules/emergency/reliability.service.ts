import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ReliabilityService {
  private readonly logger = new Logger(ReliabilityService.name);

  /**
   * Records latency and environment context for Section 12 (Reliability).
   */
  async logTelemetry(
    incidentId: string,
    stage: string,
    latency: number,
    context: any,
  ): Promise<void> {
    this.logger.log(
      `[TELEMETRY] Incident ${incidentId} reached ${stage} in ${latency}ms. Context: ${JSON.stringify(context)}`,
    );
    // In production, this writes to IncidentTelemetry entity
  }

  /**
   * Failure Simulation (Chaos Engineering) for Pilot Testing.
   */
  async simulateNetworkFailure(probability: number = 0.1): Promise<boolean> {
    const isFailing = Math.random() < probability;
    if (isFailing) {
      this.logger.warn(
        `SIMULATED FAILURE: Dropping request to test offline fallback.`,
      );
    }
    return isFailing;
  }
}
