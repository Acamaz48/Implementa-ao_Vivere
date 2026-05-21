import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthTokens, LoginResponse, ApiMessageResponse, User } from '../../shared/models/user.model';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  // Role removido por segurança (não se passa role em registos públicos/abertos)
}

// NOVO: Payload específico para administradores criarem utilizadores já com o cargo definido
export interface AdminCreateUserPayload extends RegisterPayload {
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8081/auth';

  // ==========================================
  // 🔐 ROTAS DE AUTENTICAÇÃO E REGISTO
  // ==========================================

  register(user: RegisterPayload): Observable<ApiMessageResponse> {
    return this.http.post<ApiMessageResponse>(`${this.apiUrl}/register`, user);
  }

  // NOVO: Rota para o Admin criar utilizadores (pode usar o mesmo endpoint se o backend permitir,
  // ou um endpoint protegido futuro. Por agora, enviamos o payload completo).
  adminCreateUser(user: AdminCreateUserPayload): Observable<ApiMessageResponse> {
    return this.http.post<ApiMessageResponse>(`${this.apiUrl}/register`, user);
  }

  verifyOtp(email: string, code: string): Observable<ApiMessageResponse> {
    return this.http.post<ApiMessageResponse>(`${this.apiUrl}/verify-otp`, { email, code });
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password });
  }

  refreshToken(userId: string, refreshToken: string): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${this.apiUrl}/refresh`, { userId, refreshToken });
  }

  // ==========================================
  // 🔄 ROTAS DE RECUPERAÇÃO DE SENHA
  // ==========================================

  forgotPassword(email: string): Observable<ApiMessageResponse> {
    return this.http.post<ApiMessageResponse>(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(email: string, otpCode: string, newPassword: string): Observable<ApiMessageResponse> {
    return this.http.post<ApiMessageResponse>(`${this.apiUrl}/reset-password`, { 
      email, 
      otpCode, 
      newPassword 
    });
  }

  // ==========================================
  // 👤 ROTAS PROTEGIDAS DO UTILIZADOR
  // ==========================================

  updateProfile(name: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/profile`, { name });
  }

  // NOVO: Busca a lista real de utilizadores na base de dados
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }
}