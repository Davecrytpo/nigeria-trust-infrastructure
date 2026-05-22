import { Controller, Post, Body } from '@nestjs/common';
import { SmsGatewayService } from './sms-gateway.service';

@Controller('emergency/sms-webhook')
export class SmsGatewayController {
  constructor(private readonly smsGatewayService: SmsGatewayService) {}

  /**
   * Generic SMS Webhook handler for external providers.
   * Fulfills Section 5 (SMS Emergency System).
   */
  @Post()
  async handleWebhook(@Body() payload: { from: string; text: string }) {
    return this.smsGatewayService.handleIncomingSms(payload.from, payload.text);
  }
}
