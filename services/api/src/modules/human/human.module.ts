import { Module } from '@nestjs/common';
import { HumanController } from './human.controller';
import { HumanService } from './human.service';
import { DeadManSwitchService } from './dead-man-switch.service';

@Module({
  controllers: [HumanController],
  providers: [HumanService, DeadManSwitchService],
  exports: [HumanService, DeadManSwitchService],
})
export class HumanModule {}
