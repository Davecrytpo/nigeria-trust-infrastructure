import { Test, TestingModule } from '@nestjs/testing';
import { SmsGatewayController } from './sms-gateway.controller';
import { SmsGatewayService } from './sms-gateway.service';

describe('SmsGatewayController', () => {
  let controller: SmsGatewayController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SmsGatewayController],
      providers: [
        {
          provide: SmsGatewayService,
          useValue: { handleIncomingSms: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<SmsGatewayController>(SmsGatewayController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
