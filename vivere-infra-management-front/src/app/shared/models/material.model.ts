// vivere-infra-management-front\src\app\shared\models\material.model.ts

export interface MaterialCategory {
  id: string;
  name: string;
}

export interface Material {
  id: string;
  name: string;
  categoryId: string;
  stock: number;
  // O backend faz um include: { category: true }
  category?: MaterialCategory; 
}

export interface StructureType {
  id: string;
  name: string;
}

export interface StructureTemplate {
  id: string;
  structureId: string;
  materialId: string;
  quantity: number;
  // O backend faz um include para trazer o nome real do material no gabarito
  material?: Material; 
}

export interface Structure {
  id: string;
  structureTypeId: string;
  name: string;
  // Inclusões retornadas pelo Prisma
  type?: StructureType;
  templates: StructureTemplate[];
}

// ==========================================
// 📦 PAYLOADS (Envio de dados para a API)
// ==========================================

export interface CreateMaterialPayload {
  name: string;
  categoryName: string;
  stock: number;
}

export interface TemplateItemPayload {
  materialId: string;
  quantity: number;
}

export interface CreateStructurePayload {
  structureName: string;
  typeName: string;
  items: TemplateItemPayload[];
}

export interface RegisterStockPayload {
  operationalUnitId: string;
  quantity: number;
}