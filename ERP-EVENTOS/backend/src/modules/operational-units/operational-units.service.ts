import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
@Injectable()
export class OperationalUnitsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.operationalUnit.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }
}