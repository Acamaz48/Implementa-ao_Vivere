import { Injectable, signal, computed } from '@angular/core';
import { User, UserRole } from '../../shared/models/user.model';

@Injectable({ providedIn: 'root' })
export class UserStore {
  private userSignal = signal<User | null>(null);
  
  isAuthenticated = computed(() => this.userSignal() !== null);
  
  isAdmin = computed(() => {
    const user = this.userSignal();
    return String(user?.role) === 'ADMIN';
  });

  constructor() {
    this.loadUserFromToken();
  }

  setUser(user: User) {
    this.userSignal.set(user);
  }

  setTokens(tokens: any) {
    const token = tokens.access_token || tokens.accessToken;
    if (token) {
      localStorage.setItem('accessToken', token);
      this.loadUserFromToken();
    }
  }

  loadUserFromToken() {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        // CORREÇÃO CRÍTICA: Decodificação segura de Base64Url (Padrão JWT)
        let payloadBase64 = token.split('.')[1];
        payloadBase64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
        const payloadJson = JSON.parse(atob(payloadBase64));
        
        // CORREÇÃO DE ARQUITETURA: Hack de Bypass removido.
        // Agora o cargo vem diretamente do Token assinado pelo Backend.
        // Utilizamos o fallback para 'PRODUCAO' apenas se o token for muito antigo (transição).
        const cargoRealDoBanco = payloadJson.role || UserRole.PRODUCAO;

        this.userSignal.set({
          id: payloadJson.sub,
          email: payloadJson.email,
          role: cargoRealDoBanco,
          name: payloadJson.name || 'Usuário',
          status: 'ACTIVE',
          isVerified: true
        } as User);
        
      } catch (e) {
        console.error('Erro de Segurança: Falha ao decodificar token JWT', e);
        this.logout();
      }
    }
  }

  logout() {
    this.userSignal.set(null);
    localStorage.clear(); // Limpa tokens corrompidos ou expirados
  }
}