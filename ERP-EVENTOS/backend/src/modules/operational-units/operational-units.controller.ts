import { Controller, Get, UseGuards } from '@nestjs/common';
import { OperationalUnitsService } from './operational-units.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('operational-units')
@UseGuards(JwtAuthGuard)
export class OperationalUnitsController {
  constructor(
    private readonly operationalUnitsService: OperationalUnitsService,
  ) {}

  @Get()
  findAll() {
    return this.operationalUnitsService.findAll();
  }
}