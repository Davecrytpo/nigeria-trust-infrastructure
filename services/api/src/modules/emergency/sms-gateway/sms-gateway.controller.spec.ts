import { Test, TestingModule } from '@nestjs/testing';
import { SmsGatewayController } from './sms-gateway.controller';

describe('SmsGatewayController', () => {
  let controller: SmsGatewayController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SmsGatewayController],
    }).compile();

    controller = module.get<SmsGatewayController>(SmsGatewayController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
