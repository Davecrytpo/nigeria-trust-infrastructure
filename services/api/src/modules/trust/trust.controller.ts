import { Controller, Get, Post, Body, Param, Put, UseGuards } from '@nestjs/common';
import { TrustService } from './trust.service';
import { VerificationStatus } from './entities/user.entity';

@Controller('trust')
export class TrustController {
  constructor(private readonly trustService: TrustService) {}

  /**
   * Lists all responders awaiting verification (Section 2/10).
   */
  @Get('pending-responders')
  async listPending() {
    return [
      { id: 'u-101', fullName: 'John Doe', phoneNumber: '+2348011112222', submittedAt: new Date() },
      { id: 'u-102', fullName: 'Lagos Community Clinic', phoneNumber: '+2348033334444', submittedAt: new Date() },
    ];
  }

  /**
   * Approve or Suspend a responder.
   */
  @Put('verify/:userId')
  async verify(@Param('userId') userId: string, @Body() body: { status: VerificationStatus }) {
    await this.trustService.verifyUser(userId, body.status);
    return { success: true, message: `User ${userId} status updated to ${body.status}` };
  }

  /**
   * Manually adjust trust score (Operational override).
   */
  @Post('adjust-score/:userId')
  async adjustScore(@Param('userId') userId: string, @Body() body: { delta: number }) {
    const newScore = await this.trustService.calculateTrustScore(userId, body.delta);
    return { success: true, userId, newScore };
  }
}
