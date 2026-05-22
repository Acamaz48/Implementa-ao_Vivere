import { PartialType } from '@nestjs/mapped-types';
import { CreateOperationalUnitDto } from './create-operational-unit.dto';

export class UpdateOperationalUnitDto extends PartialType(CreateOperationalUnitDto) {}
