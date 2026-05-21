// CORREÇÃO: Adição do contrato de Endereço que reflete a tabela Address do Backend
export interface Address {
  id?: string;
  street?: string;
  number?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
}

export interface Event {
  id: string;
  name: string;      // No banco está 'name', não 'title'
  
  // CORREÇÃO: latitude e longitude removidas da raiz. 
  // Agora elas vêm encapsuladas no objeto address.
  addressId?: string;
  address?: Address;
  
  startDate: Date;
  endDate: Date;
  status: string; // O Backend define como string pura no Prisma, sem restrição de Enum no banco
  createdAt?: Date;
}