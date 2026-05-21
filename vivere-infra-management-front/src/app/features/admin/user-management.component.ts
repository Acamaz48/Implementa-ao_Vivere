import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/auth/auth.service';
import { User } from '../../shared/models/user.model';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="page-header">
      <div class="page-header__title">
        <span class="eyebrow">Administração</span>
        <h1>Gestão de Pessoas</h1>
        <p class="subtitle">Controle de acessos, cargos e permissões do sistema.</p>
      </div>
      <div class="page-header__right">
        <button class="btn-primary" (click)="showModal = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
          Novo Utilizador
        </button>
      </div>
    </header>

    <main class="admin-main">
      <article class="card no-padding">
        <table class="data-table data-table--full">
          <thead>
            <tr>
              <th>Nome do Colaborador</th>
              <th>E-mail Corporativo</th>
              <th>Cargo / Departamento</th>
              <th class="cell-center">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of users()">
              <td>
                <div class="td-strong">{{ user.name }}</div>
              </td>
              <td class="td-muted">{{ user.email }}</td>
              <td>
                <span class="badge" 
                      [ngClass]="{
                        'badge--info': user.role === 'ADMIN',
                        'badge--warn': user.role === 'GALPAO',
                        'badge--success': user.role === 'PRODUCAO'
                      }">
                  {{ user.role }}
                </span>
              </td>
              <td class="cell-center">
                <span class="status-dot completed" [title]="user.isVerified ? 'Ativo' : 'Pendente de Verificação'"></span>
              </td>
            </tr>
            
            <tr *ngIf="isLoadingList()">
              <td colspan="4" style="text-align: center; padding: 30px; color: #888;">A carregar utilizadores...</td>
            </tr>

            <tr *ngIf="!isLoadingList() && users().length === 0">
              <td colspan="4" style="text-align: center; padding: 30px; color: #888;">Nenhum utilizador encontrado.</td>
            </tr>
          </tbody>
        </table>
      </article>
    </main>

    <div *ngIf="showModal" class="modal-overlay" (click)="showModal = false">
      <div class="modal" (click)="$event.stopPropagation()">
        <header class="modal__head">
          <div>
            <span class="modal__eyebrow">Novo Acesso</span>
            <h3>Cadastrar Colaborador</h3>
          </div>
          <button class="btn-close" (click)="showModal = false">✕</button>
        </header>

        <div class="modal__body">
          <div class="field">
            <label>Nome Completo</label>
            <input [(ngModel)]="newUser.name" placeholder="Ex: Carlos Silva" [disabled]="isSaving()" />
          </div>
          <div class="field">
            <label>E-mail Corporativo</label>
            <input [(ngModel)]="newUser.email" type="email" placeholder="carlos@empresa.com" [disabled]="isSaving()" />
          </div>
          <div class="field-grid">
            <div class="field">
              <label>Cargo / Departamento</label>
              <select [(ngModel)]="newUser.role" [disabled]="isSaving()">
                <option value="PRODUCAO">Produção (Eventos)</option>
                <option value="GALPAO">Galpão (Estoque)</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
            <div class="field">
              <label>Senha Inicial</label>
              <input type="password" [(ngModel)]="newUser.password" placeholder="••••••••" [disabled]="isSaving()" />
            </div>
          </div>
        </div>

        <footer class="modal__foot">
          <button class="btn-secondary" (click)="showModal = false" [disabled]="isSaving()">Cancelar</button>
          <button class="btn-primary" (click)="salvarUsuario()" [disabled]="isSaving()">
            {{ isSaving() ? 'A Processar...' : 'Criar Conta' }}
          </button>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; padding: 18px 28px; background: var(--surface); border-bottom: 1px solid var(--border); }
    .eyebrow { display: block; font-size: 11px; font-weight: 600; letter-spacing: 1.2px; color: var(--text-tertiary); text-transform: uppercase; margin-bottom: 3px; }
    .page-header__title h1 { font-size: 18px; font-weight: 700; margin: 0; }
    .page-header__title .subtitle { margin: 4px 0 0; font-size: 13px; color: var(--text-secondary); }
    .btn-primary { display: inline-flex; align-items: center; justify-content: center; gap: 7px; padding: 8px 13px; border-radius: var(--radius); font-size: 13px; font-weight: 500; cursor: pointer; background: var(--vivere-orange); color: white; border: 1px solid var(--vivere-orange); transition: all 0.2s; }
    .btn-primary:disabled { background: #cbd5e1; border-color: #cbd5e1; cursor: not-allowed; }
    .btn-primary svg { width: 16px; height: 16px; }
    .btn-secondary { padding: 8px 13px; border-radius: var(--radius); font-size: 13px; font-weight: 500; cursor: pointer; background: var(--surface); border: 1px solid var(--border); }
    .btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }
    .admin-main { padding: 20px 28px; }
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); }
    .card.no-padding { padding: 0; overflow: hidden; }
    .data-table--full { width: 100%; border-collapse: collapse; font-size: 13px; }
    .data-table--full th { padding: 10px 14px; background: var(--surface-sunken); text-align: left; font-size: 10.5px; font-weight: 600; text-transform: uppercase; color: var(--text-tertiary); border-bottom: 1px solid var(--border); }
    .data-table--full td { padding: 14px; border-bottom: 1px solid var(--border-subtle); vertical-align: middle; }
    .td-strong { font-weight: 600; color: var(--text-primary); }
    .td-muted { color: var(--text-tertiary); }
    .cell-center { text-align: center; }
    .badge { display: inline-block; padding: 3px 8px; font-size: 10px; font-weight: 600; border-radius: 4px; border: 1px solid; }
    .badge--success { background: var(--status-success-bg); color: var(--status-success); border-color: var(--status-success-border); }
    .badge--warn { background: var(--status-warning-bg); color: var(--status-warning); border-color: var(--status-warning-border); }
    .badge--info { background: #e0f2fe; color: #1d4ed8; border-color: #bfdbfe; }
    .status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; }
    .status-dot.completed { background: var(--status-success); box-shadow: 0 0 0 3px var(--status-success-bg); }
    
    /* MODAL */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 3000; }
    .modal { width: 500px; background: var(--surface); border-radius: var(--radius-lg); box-shadow: var(--shadow-modal); display: flex; flex-direction: column; }
    .modal__head { padding: 18px 22px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: flex-start; }
    .modal__eyebrow { font-size: 10.5px; font-weight: 600; color: var(--vivere-orange); display: block; margin-bottom: 4px; }
    .modal__head h3 { margin: 0; font-size: 16px; font-weight: 600; }
    .btn-close { background: none; border: none; font-size: 16px; cursor: pointer; color: var(--text-tertiary); }
    .modal__body { padding: 20px 22px; display: flex; flex-direction: column; gap: 15px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field label { font-size: 11.5px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; }
    .field input, .field select { padding: 10px; border: 1px solid var(--border); border-radius: 4px; outline: none; }
    .field input:focus, .field select:focus { border-color: var(--vivere-orange); }
    .field input:disabled, .field select:disabled { background: #f1f5f9; color: #94a3b8; }
    .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .modal__foot { padding: 15px 22px; background: var(--surface-sunken); border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 10px; }
  `]
})
export class UserManagementComponent implements OnInit {
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef); // CORREÇÃO: Prevenção de Fuga de Memória
  
  users = signal<User[]>([]);
  showModal = false;
  isSaving = signal(false); // CORREÇÃO: Controlo de loading de botões
  isLoadingList = signal(true);
  
  newUser = { name: '', email: '', password: '', role: 'PRODUCAO' };

  ngOnInit() {
    this.carregarUsuarios();
  }

  carregarUsuarios() {
    this.isLoadingList.set(true);
    
    // Conexão real com o Backend
    this.authService.getUsers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (dadosReais) => {
          this.users.set(dadosReais);
          this.isLoadingList.set(false);
        },
        error: (err) => {
          console.error('Falha ao carregar lista de utilizadores', err);
          this.isLoadingList.set(false);
          // O Interceptor trata o erro 401 automaticamente se for o caso
        }
      });
  }

  salvarUsuario() {
    if (!this.newUser.name || !this.newUser.email || !this.newUser.password) {
      alert("Preencha todos os campos obrigatórios!"); return;
    }
    
    this.isSaving.set(true);

    this.authService.adminCreateUser(this.newUser)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          alert('Utilizador criado com sucesso! O convite (OTP) foi enviado para o e-mail.');
          this.showModal = false;
          this.newUser = { name: '', email: '', password: '', role: 'PRODUCAO' };
          this.isSaving.set(false);
          
          // Auto-refresh da grelha de dados
          this.carregarUsuarios();
        },
        error: (err) => {
          alert(err.error?.message || 'Erro ao criar utilizador.');
          this.isSaving.set(false);
        }
      });
  }
}