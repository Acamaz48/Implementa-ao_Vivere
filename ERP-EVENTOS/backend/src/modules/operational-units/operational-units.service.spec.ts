import { Test, TestingModule } from '@nestjs/testing';
import { OperationalUnitsService } from './operational-units.service';

describe('OperationalUnitsService', () => {
  let service: OperationalUnitsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OperationalUnitsService],
    }).compile();

    service = module.get<OperationalUnitsService>(OperationalUnitsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
