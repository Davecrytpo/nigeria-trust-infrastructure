import { Test, TestingModule } from '@nestjs/testing';
import { EmergencyService } from './emergency.service';
import { ReliabilityService } from './reliability.service';
import { ReplayService } from './replay.service';

describe('EmergencyService', () => {
  let service: EmergencyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmergencyService,
        {
          provide: ReliabilityService,
          useValue: { logTelemetry: jest.fn() },
        },
        {
          provide: ReplayService,
          useValue: { captureEvent: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<EmergencyService>(EmergencyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
