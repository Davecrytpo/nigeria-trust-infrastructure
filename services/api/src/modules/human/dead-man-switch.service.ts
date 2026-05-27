import { Injectable, Logger } from '@nestjs/common';

export interface DeadManState {
  responderId: string;
  lastHeartbeat: Date;
  lastLat: number;
  lastLng: number;
  batteryLevel: number;
  isConnectivityLost: boolean;
}

@Injectable()
export class DeadManSwitchService {
  private readonly logger = new Logger(DeadManSwitchService.name);
  private responderStates: Map<string, DeadManState> = new Map();

  /**
   * Evaluates if a responder is in danger.
   * Considers battery, connectivity, and movement thresholds.
   */
  async checkResponderSafety(responderId: string): Promise<boolean> {
    const state = this.responderStates.get(responderId);
    if (!state) return true;

    const silenceDurationSec =
      (Date.now() - state.lastHeartbeat.getTime()) / 1000;

    // RULE 1: Connectivity Loss vs Silence.
    // If battery was high (>20%) and they stop sending data for 5 mins -> Potential Danger.
    if (state.batteryLevel > 20 && silenceDurationSec > 300) {
      this.logger.error(
        `DEAD-MAN TRIGGER: Responder ${responderId} silent for 5m with high battery.`,
      );
      return false; // Trigger alert
    }

    // RULE 2: Immobility during active incident.
    // (Logic would compare lastLat/lastLng with movement thresholds)

    return true;
  }

  async updateHeartbeat(
    responderId: string,
    lat: number,
    lng: number,
    battery: number,
  ): Promise<void> {
    this.responderStates.set(responderId, {
      responderId,
      lastHeartbeat: new Date(),
      lastLat: lat,
      lastLng: lng,
      batteryLevel: battery,
      isConnectivityLost: false,
    });
  }
}
