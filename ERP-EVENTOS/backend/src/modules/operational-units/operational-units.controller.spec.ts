import { Test, TestingModule } from '@nestjs/testing';
import { OperationalUnitsController } from './operational-units.controller';
import { OperationalUnitsService } from './operational-units.service';

describe('OperationalUnitsController', () => {
  let controller: OperationalUnitsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OperationalUnitsController],
      providers: [OperationalUnitsService],
    }).compile();

    controller = module.get<OperationalUnitsController>(OperationalUnitsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
