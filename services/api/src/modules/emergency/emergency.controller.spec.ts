import { Test, TestingModule } from '@nestjs/testing';
import { EmergencyController } from './emergency.controller';
import { HumanService } from '../human/human.service';
import { EmergencyService } from './emergency.service';

describe('EmergencyController', () => {
  let controller: EmergencyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmergencyController],
      providers: [
        {
          provide: EmergencyService,
          useValue: {
            detectIncident: jest.fn(),
            getIncident: jest.fn(),
            listIncidents: jest.fn(),
            incidentEvents: jest.fn(),
            escalateIncident: jest.fn(),
            trackResponse: jest.fn(),
            reportCoercion: jest.fn(),
            resolveIncident: jest.fn(),
          },
        },
        {
          provide: HumanService,
          useValue: { findNearbyResponders: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<EmergencyController>(EmergencyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
