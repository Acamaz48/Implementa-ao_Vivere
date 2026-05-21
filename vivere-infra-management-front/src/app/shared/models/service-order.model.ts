export interface ServiceOrder {
  id: string;
  number: string;
  eventId: string;
  status: ServiceOrderStatus;
  materials: SelectedMaterial[];
  totalValue: number;
  createdAt: Date;
}

// CORREÇÃO: Enum espelhado exatamente com o banco de dados (Prisma)
export enum ServiceOrderStatus {
  DRAFT = 'DRAFT',
  READY = 'READY',
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  CANCELED = 'CANCELED',
}

export interface SelectedMaterial {
  materialId: string;
  materialName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}