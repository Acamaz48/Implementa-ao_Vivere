// viverere-infra-management-front\src\app\shared\models\user.model.ts

// Espelho exato do enum UserRole do Prisma Schema (Backend)
export enum UserRole { 
  PRODUCAO = 'PRODUCAO', 
  GALPAO = 'GALPAO', 
  ADMIN = 'ADMIN' 
}

// Mantido para granularidade de UI (ex: esconder botões específicos)
export enum Permission {
  VIEW_DASHBOARD = 'VIEW_DASHBOARD',
  MANAGE_USERS = 'MANAGE_USERS',
  MANAGE_INVENTORY = 'MANAGE_INVENTORY',
  MANAGE_OS = 'MANAGE_OS'
}

// Representação do utilizador na UI (Baseado no modelo do Prisma)
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE';
  isVerified: boolean;
  permissions?: Permission[]; // Opcional, mantido para compatibilidade com o sistema antigo
}

// Tipagem rigorosa para o armazenamento de sessão
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// NOVO: Contrato exato do que o backend responde na rota de login
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

// NOVO: Contrato genérico para respostas de sucesso do backend (ex: OTP, Reset Pass)
export interface ApiMessageResponse {
  message: string;
}