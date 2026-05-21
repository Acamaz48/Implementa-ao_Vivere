import { Component, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/auth/auth.service';
import { UserStore } from '../../core/stores/user.store';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-page">
      
      <div class="abstract-bg">
        <div class="glow-shape orange-glow"></div>
        <div class="glow-shape gray-glow"></div>
      </div>

      <div class="auth-wrapper">
        
        <aside class="auth-sidebar">
          <div class="sidebar-content">
            
            <div class="brand-container">
              <img src="vivere_logo.png" alt="Vivere Entretenimento" class="brand-logo" />
            </div>

            <div class="abstract-graphic">
              <div class="wire-box w-100 tall"></div>
              
              <div class="wire-row">
                <div class="wire-box w-30 highlight"></div>
                <div class="wire-box w-70"></div>
              </div>

              <div class="wire-row">
                <div class="wire-circle"></div>
                <div class="wire-box w-50"></div>
                <div class="wire-box w-20"></div>
              </div>

              <div class="wire-row">
                <div class="wire-box w-60"></div>
                <div class="wire-box w-40 highlight-soft"></div>
              </div>

              <div class="wire-tracks">
                <div class="track"><div class="track-fill w-80"></div></div>
                <div class="track"><div class="track-fill w-40 highlight-fill"></div></div>
                <div class="track"><div class="track-fill w-60"></div></div>
              </div>

              <div class="wire-row footer-wires">
                <div class="wire-box w-20"></div>
                <div class="wire-box w-80"></div>
              </div>
            </div>
            
          </div>
        </aside>

        <main class="auth-main">
          <div class="auth-card">
            @if (step() === 'forgot-password') {
              <div class="auth-head">
                <h2>Recuperação de Senha</h2>
                <p>Informe o seu e-mail corporativo para receber as instruções de redefinição de acesso.</p>
              </div>
              
              <div class="field">
                <label>E-mail corporativo</label>
                <input [(ngModel)]="userData.email" type="email" placeholder="voce@vivere.com" [disabled]="isLoading()" />
              </div>

              <p *ngIf="errorMessage" class="msg-error">{{ errorMessage }}</p>

              <button class="btn-primary" (click)="recoverPassword()" [disabled]="!userData.email || isLoading()">
                {{ isLoading() ? 'A Processar...' : 'Enviar Instruções' }}
              </button>

              <div class="auth-actions">
                <button class="btn-link" (click)="mudarPasso('login')" [disabled]="isLoading()">Voltar para o login</button>
              </div>
            }

            @else if (step() === 'otp') {
              <div class="auth-head">
                <h2>Verificação em Duas Etapas</h2>
                <p>Para sua segurança, insira o código enviado para <strong>{{ userData.email }}</strong></p>
              </div>

              <div class="field">
                <label>Código de Autenticação</label>
                <input class="otp-input mono" [(ngModel)]="otpCode" placeholder="000000" maxlength="6" [disabled]="isLoading()" />
              </div>
              
              <p *ngIf="errorMessage" class="msg-error">{{ errorMessage }}</p>

              <button class="btn-primary" (click)="verifyOtp()" [disabled]="otpCode.length < 6 || isLoading()">
                {{ isLoading() ? 'A Validar...' : 'Validar Identidade' }}
              </button>

              <div class="auth-actions">
                <button class="btn-link" (click)="mudarPasso('login')" [disabled]="isLoading()">Cancelar operação</button>
              </div>
            }

            @else {
              <div class="auth-head">
                <h2>Acesso Restrito</h2>
                <p>Identifique-se para gerir os recursos de infraestrutura.</p>
              </div>

              <div class="field">
                <label>E-mail corporativo</label>
                <input [(ngModel)]="userData.email" placeholder="nome@vivere.com" [disabled]="isLoading()" />
              </div>
              
              <div class="field">
                <label>Senha</label>
                <input [(ngModel)]="userData.password" type="password" placeholder="••••••••" (keyup.enter)="login()" [disabled]="isLoading()" />
              </div>

              <p *ngIf="errorMessage" class="msg-error">{{ errorMessage }}</p>

              <button class="btn-primary" (click)="login()" [disabled]="!userData.email || !userData.password || isLoading()">
                {{ isLoading() ? 'A Autenticar...' : 'Acessar Plataforma' }}
              </button>

              <div class="auth-actions">
                <button class="btn-link" (click)="mudarPasso('forgot-password')" [disabled]="isLoading()">Esqueci a minha senha</button>
              </div>
            }
            
            <footer class="card-footer">
              Sistema de Gestão Vivere
            </footer>
          </div>
        </main>

      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      position: relative;
      min-height: 100vh;
      background-color: #fcfdfe;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .abstract-bg {
      position: absolute;
      inset: 0;
      background-image: radial-gradient(#e2e8f0 1.2px, transparent 1.2px);
      background-size: 30px 30px;
      z-index: 0;
    }

    .glow-shape {
      position: absolute;
      border-radius: 50%;
      filter: blur(120px);
      z-index: 0;
      opacity: 0.5;
      pointer-events: none;
    }
    .orange-glow {
      width: 600px; height: 600px;
      background: rgba(255, 102, 0, 0.12);
      top: -150px; left: -100px;
    }
    .gray-glow {
      width: 700px; height: 700px;
      background: rgba(203, 213, 225, 0.3);
      bottom: -250px; right: -50px;
    }

    .auth-wrapper {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 1100px; 
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      align-items: center;
      padding: 40px;
      gap: 60px;
    }

    .auth-sidebar {
      display: flex;
      flex-direction: column;
    }

    .brand-container {
      margin-bottom: 50px;
    }

    .brand-logo {
      max-width: 300px;
      height: auto;
      display: block;
      margin-bottom: 16px;
    }

    .abstract-graphic {
      display: flex;
      flex-direction: column;
      gap: 16px;
      opacity: 0.8;
    }

    .wire-box {
      height: 10px;
      background: #edf2f7;
      border-radius: 5px;
    }
    .wire-box.tall { height: 32px; background: #f1f5f9; }
    .wire-row { display: flex; gap: 16px; align-items: center; }
    .wire-circle {
      width: 12px; height: 12px;
      border: 3px solid #cbd5e1;
      border-radius: 50%;
    }
    
    .w-100 { width: 100%; }
    .w-80 { width: 80%; }
    .w-70 { width: 70%; }
    .w-60 { width: 60%; }
    .w-50 { width: 50%; }
    .w-40 { width: 40%; }
    .w-30 { width: 30%; }
    .w-20 { width: 20%; }
    
    .highlight { background: rgba(255, 102, 0, 0.3); }
    .highlight-soft { background: #e2e8f0; border: 1px dashed #cbd5e1; height: 20px; }

    .wire-tracks {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin: 10px 0;
      padding: 16px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: #ffffff;
    }
    .track {
      height: 8px;
      background: #f1f5f9;
      border-radius: 4px;
      width: 100%;
    }
    .track-fill {
      height: 100%;
      background: #cbd5e1;
      border-radius: 4px;
    }
    .highlight-fill { background: rgba(255, 102, 0, 0.4); }

    .footer-wires { margin-top: 20px; border-top: 1px solid #f1f5f9; padding-top: 20px; }

    .auth-main {
      display: flex;
      justify-content: center;
    }

    .auth-card {
      background: #ffffff;
      width: 100%;
      max-width: 480px; 
      padding: 48px;
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
      border: 1px solid #f1f5f9;
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    .auth-head h2 {
      margin: 0 0 8px;
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
    }

    .auth-head p {
      margin: 0;
      font-size: 15px;
      color: #64748b;
      line-height: 1.5;
    }

    .field { display: flex; flex-direction: column; gap: 10px; }
    
    .field label {
      font-size: 13px;
      font-weight: 700;
      color: #334155;
    }

    .field input {
      padding: 14px 16px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 15px;
      background: #f8fafc;
      color: #0f172a;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .field input:focus {
      outline: none;
      background: #ffffff;
      border-color: #ff6600;
      box-shadow: 0 0 0 4px rgba(255, 102, 0, 0.1);
    }

    .field input:disabled {
      background: #e2e8f0;
      color: #94a3b8;
      cursor: not-allowed;
    }

    .otp-input {
      letter-spacing: 16px;
      text-align: center;
      font-size: 28px !important;
      font-weight: 800;
      color: #ff6600 !important;
    }

    .btn-primary {
      margin-top: 10px;
      padding: 16px;
      background: #ff6600;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 700;
      font-size: 15px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .btn-primary:hover:not(:disabled) { 
      background: #e65c00;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(255, 102, 0, 0.2);
    }
    
    .btn-primary:disabled {
      background: #f1f5f9;
      color: #94a3b8;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .auth-actions { text-align: center; }

    .btn-link {
      background: none;
      border: none;
      color: #64748b;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: color 0.2s;
    }

    .btn-link:hover:not(:disabled) { color: #ff6600; text-decoration: underline; }
    .btn-link:disabled { cursor: not-allowed; opacity: 0.7; }

    .msg-error {
      padding: 14px;
      background: #fff1f2;
      border: 1px solid #fecaca;
      color: #be123c;
      font-size: 14px;
      border-radius: 8px;
      font-weight: 600;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-5px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .card-footer {
      text-align: center;
      font-size: 12px;
      color: #cbd5e1;
      border-top: 1px solid #f1f5f9;
      padding-top: 20px;
      font-weight: 500;
    }

    @media (max-width: 950px) {
      .auth-wrapper { 
        grid-template-columns: 1fr;
        gap: 30px;
        padding: 20px;
      }
      .auth-sidebar { align-items: center; text-align: center; }
      .abstract-graphic { display: none; }
      .brand-container { margin-bottom: 20px; }
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private userStore = inject(UserStore);
  private router = inject(Router);
  
  // CORREÇÃO: Injeção do DestroyRef para proteger a aplicação de Memory Leaks
  private destroyRef = inject(DestroyRef);

  step = signal<'login' | 'forgot-password' | 'otp'>('login');
  
  // CORREÇÃO DE UX: Controlo de loading para evitar "double click" em chamadas lentas
  isLoading = signal<boolean>(false); 

  userData = { name: '', email: '', password: '', role: 'PRODUCAO' };
  otpCode = '';
  errorMessage = '';

  mudarPasso(novoPasso: 'login' | 'forgot-password' | 'otp') {
    this.errorMessage = '';
    this.otpCode = ''; // Limpa os vestígios da tentativa anterior
    this.step.set(novoPasso);
  }

  recoverPassword() {
    this.errorMessage = '';
    this.isLoading.set(true);
    
    // CORREÇÃO: Chamando a rota real do backend em vez do mock com alert
    this.authService.forgotPassword(this.userData.email)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          alert(res.message); // Usamos a mensagem gerada com segurança pela nossa API
          this.mudarPasso('otp'); // Manda o utilizador direto para a tela de preencher o OTP
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage = err.error?.message || 'Ocorreu um erro. Tente novamente mais tarde.';
        }
      });
  }

  verifyOtp() {
    this.errorMessage = '';
    this.isLoading.set(true);

    this.authService.verifyOtp(this.userData.email, this.otpCode)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          // OTP Validado! Volta para o login para o utilizador colocar a sua senha
          this.step.set('login');
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage = err.error?.message || 'O código inserido é inválido ou expirou.';
        }
      });
  }

  login() {
    this.errorMessage = '';
    this.isLoading.set(true);

    this.authService.login(this.userData.email, this.userData.password)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tokens) => {
          this.isLoading.set(false);
          this.userStore.setTokens(tokens);
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage = err.error?.message || 'Credenciais incorretas.';
        }
      });
  }
}