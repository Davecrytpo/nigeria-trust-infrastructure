import { Injectable, Logger } from '@nestjs/common';
import { EmergencyService } from '../emergency.service';
import { EntryMethod, IncidentType, SMS_KEYWORDS } from '@shared/domain';

@Injectable()
export class SmsGatewayService {
  private readonly logger = new Logger(SmsGatewayService.name);

  constructor(private readonly emergencyService: EmergencyService) {}

  /**
   * Processes an incoming SMS message (Section 5).
   * Format: "KEYWORD [OPTIONAL_LOCATION_DETAILS]"
   */
  async handleIncomingSms(phoneNumber: string, message: string): Promise<any> {
    const rawContent = message.trim().toUpperCase();
    const [keyword, ...details] = rawContent.split(' ');

    const incidentType = SMS_KEYWORDS[keyword as keyof typeof SMS_KEYWORDS];

    if (!incidentType) {
      this.logger.warn(`Received invalid SMS keyword: ${keyword} from ${phoneNumber}`);
      return { status: 'error', message: 'Invalid Keyword' };
    }

    this.logger.log(`Creating SMS-triggered incident: ${incidentType} for ${phoneNumber}`);

    // Create the incident record in Stage 1: Detection
    const incident = await this.emergencyService.detectIncident({
      requesterId: phoneNumber, // Use phone number as temporary ID
      type: incidentType,
      entryMethod: EntryMethod.SMS,
      nearbyLandmarks: details.join(' '),
    });

    return {
      status: 'success',
      incidentId: incident.id,
      responseMessage: `EMERGENCY RECORDED: A ${incidentType} incident has been created. Responders are being notified. Stay safe.`,
    };
  }

  /**
   * Redundancy logic for SMS Delivery (Section 7)
   */
  async sendSms(to: string, message: string): Promise<boolean> {
    this.logger.log(`Sending SMS to ${to}: ${message}`);
    // In Level 3, we would implement multi-provider logic (Carrier A -> Carrier B)
    return true;
  }
}
