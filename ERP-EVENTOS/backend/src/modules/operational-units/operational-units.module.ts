import { Module } from '@nestjs/common';
import { OperationalUnitsController } from './operational-units.controller';
import { OperationalUnitsService } from './operational-units.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [OperationalUnitsController],
  providers: [OperationalUnitsService, PrismaService],
})
export class OperationalUnitsModule {}