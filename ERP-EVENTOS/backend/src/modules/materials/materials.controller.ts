import { Controller, Post, Get, Body, UseGuards,Request, Param, Patch, Delete } from '@nestjs/common';
import { MaterialsService } from './materials.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';

import {
  CreateMaterialDto,
  CreateStructureTemplateDto,
  UpdateMaterialDto,
  RegisterStockDto,
} from './dto/material.dto';

@Controller('materials')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  // ==========================================
  // 🏗️ GESTÃO DE ESTRUTURAS (KITS)
  // ==========================================

  @Post('structure')
  @Roles(UserRole.GALPAO, UserRole.ADMIN)
  createStructure(@Body() dto: CreateStructureTemplateDto) {
    return this.materialsService.createStructureWithTemplate(dto);
  }

  @Get('structure')
  @Roles(UserRole.PRODUCAO, UserRole.GALPAO, UserRole.ADMIN)
  findAllStructures() {
    return this.materialsService.findAllStructures();
  }

  @Delete('structure/:id')
  @Roles(UserRole.GALPAO, UserRole.ADMIN)
  removeStructure(@Param('id') id: string) {
    return this.materialsService.removeStructure(id);
  }

  // ==========================================
  // 📦 GESTÃO DO CATÁLOGO DE MATERIAIS
  // ==========================================

  @Post()
  @Roles(UserRole.GALPAO, UserRole.ADMIN)
  createMaterial(@Body() dto: CreateMaterialDto) {
    return this.materialsService.createMaterial(dto);
  }

  @Get()
  @Roles(UserRole.PRODUCAO, UserRole.GALPAO, UserRole.ADMIN)
  findAllMaterials(@Request() req) {
  console.log(req.user);
  return this.materialsService.findAllMaterials();
}

  @Get(':id')
  @Roles(UserRole.PRODUCAO, UserRole.GALPAO, UserRole.ADMIN)
  findOneMaterial(@Param('id') id: string) {
    return this.materialsService.findOneMaterial(id);
  }

  @Patch(':id')
  @Roles(UserRole.GALPAO, UserRole.ADMIN)
  updateMaterial(@Param('id') id: string, @Body() dto: UpdateMaterialDto) {
    return this.materialsService.updateMaterial(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.GALPAO, UserRole.ADMIN)
  removeMaterial(@Param('id') id: string) {
    return this.materialsService.removeMaterial(id);
  }

  // ==========================================
  // 🏭 ENTRADA FÍSICA DE ESTOQUE
  // ==========================================

  @Post(':id/stock')
  @Roles(UserRole.GALPAO, UserRole.ADMIN)
  registerStock(@Param('id') materialId: string, @Body() dto: RegisterStockDto) {
    return this.materialsService.registerNewStock(materialId, dto);
  }
}
