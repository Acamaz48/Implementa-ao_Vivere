import { Component, signal, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-operational-units',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="page-header">
      <div class="page-header__title">
        <span class="eyebrow">Administração</span>
        <h1>Gestão de Unidades (Galpões)</h1>
        <p class="subtitle">Controle os galpões de estoque e pontos de distribuição.</p>
      </div>
      <div class="page-header__right">
        <button class="btn-primary" (click)="abrirModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          Nova Unidade
        </button>
      </div>
    </header>

    <main class="admin-main">
      <article class="card no-padding">
        <table class="data-table data-table--full">
          <thead>
            <tr>
              <th>Nome da Unidade</th>
              <th>Status</th>
              <th class="cell-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let unit of units()">
              <td>
                <div class="td-strong">{{ unit.name }}</div>
              </td>
              <td><span class="status-dot completed" title="Ativo"></span> Ativo</td>
              <td class="cell-center">
                <button class="btn-icon" (click)="deletarUnidade(unit.id)" title="Remover">🗑️</button>
              </td>
            </tr>
            <tr *ngIf="isLoading()">
              <td colspan="3" style="text-align: center; padding: 30px; color: #888;">Carregando unidades do servidor...</td>
            </tr>
            <tr *ngIf="!isLoading() && units().length === 0">
              <td colspan="3" style="text-align: center; padding: 30px; color: #888;">Nenhuma unidade cadastrada no sistema.</td>
            </tr>
          </tbody>
        </table>
      </article>
    </main>

    <div *ngIf="showModal" class="modal-overlay" (click)="fecharModal()">
      <div class="modal" (click)="$event.stopPropagation()">
        <header class="modal__head">
          <div>
            <span class="modal__eyebrow">Logística</span>
            <h3>Cadastrar Novo Galpão</h3>
          </div>
          <button class="btn-close" (click)="fecharModal()">✕</button>
        </header>

        <div class="modal__body">
          <div class="field">
            <label>Nome do Galpão</label>
            <input [(ngModel)]="formData.name" placeholder="Ex: Galpão Principal Norte" [disabled]="isSaving()" />
          </div>
        </div>

        <footer class="modal__foot">
          <button class="btn-secondary" (click)="fecharModal()" [disabled]="isSaving()">Cancelar</button>
          <button class="btn-primary" (click)="salvarUnidade()" [disabled]="isSaving() || !formData.name">
            {{ isSaving() ? 'Processando...' : 'Criar Galpão' }}
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
    .btn-primary { display: inline-flex; align-items: center; gap: 7px; padding: 8px 13px; border-radius: var(--radius); font-size: 13px; font-weight: 500; cursor: pointer; background: var(--vivere-orange); color: white; border: 1px solid var(--vivere-orange); }
    .btn-primary:disabled { background: var(--surface-sunken); color: var(--text-muted); border-color: var(--border); cursor: not-allowed; }
    .btn-primary svg { width: 16px; height: 16px; }
    .btn-secondary { padding: 8px 13px; border-radius: var(--radius); font-size: 13px; font-weight: 500; cursor: pointer; background: var(--surface); border: 1px solid var(--border); }
    .admin-main { padding: 20px 28px; }
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); }
    .card.no-padding { padding: 0; overflow: hidden; }
    .data-table--full { width: 100%; border-collapse: collapse; font-size: 13px; }
    .data-table--full th { padding: 10px 14px; background: var(--surface-sunken); text-align: left; font-size: 10.5px; font-weight: 600; text-transform: uppercase; color: var(--text-tertiary); border-bottom: 1px solid var(--border); }
    .data-table--full td { padding: 14px; border-bottom: 1px solid var(--border-subtle); vertical-align: middle; }
    .td-strong { font-weight: 600; color: var(--text-primary); }
    .cell-center { text-align: center; }
    .status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 5px;}
    .status-dot.completed { background: var(--status-success); box-shadow: 0 0 0 3px var(--status-success-bg); }
    .btn-icon { background: none; border: none; font-size: 16px; cursor: pointer; padding: 4px; border-radius: 4px; }
    .btn-icon:hover { background: var(--surface-hover); }
    
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 3000; }
    .modal { width: 400px; background: var(--surface); border-radius: var(--radius-lg); box-shadow: var(--shadow-modal); display: flex; flex-direction: column; }
    .modal__head { padding: 18px 22px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: flex-start; }
    .modal__eyebrow { font-size: 10.5px; font-weight: 600; color: var(--vivere-orange); display: block; margin-bottom: 4px; }
    .modal__head h3 { margin: 0; font-size: 16px; font-weight: 600; }
    .btn-close { background: none; border: none; font-size: 16px; cursor: pointer; color: var(--text-tertiary); }
    .modal__body { padding: 20px 22px; display: flex; flex-direction: column; gap: 15px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field label { font-size: 11.5px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; }
    .field input { padding: 10px; border: 1px solid var(--border); border-radius: 4px; outline: none; }
    .field input:focus { border-color: var(--vivere-orange); }
    .field input:disabled { background: #f1f5f9; color: #94a3b8; }
    .modal__foot { padding: 15px 22px; background: var(--surface-sunken); border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 10px; }
  `]
})
export class OperationalUnitsComponent implements OnInit {
  private http = inject(HttpClient);
  private destroyRef = inject(DestroyRef);

  units = signal<any[]>([]);
  showModal = false;
  isLoading = signal(true);
  isSaving = signal(false);
  
  formData = { name: '' };
  private apiUrl = 'http://localhost:8081/operational-units'; // Exige que o backend tenha este endpoint

  ngOnInit() {
    this.carregarUnidades();
  }

  carregarUnidades() {
    this.isLoading.set(true);
    this.http.get<any[]>(this.apiUrl)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.units.set(data);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Falha ao buscar unidades', err);
          this.isLoading.set(false);
        }
      });
  }

  abrirModal() {
    this.formData = { name: '' };
    this.showModal = true;
  }

  fecharModal() {
    this.showModal = false;
  }

  salvarUnidade() {
    if (!this.formData.name) return;
    this.isSaving.set(true);

    this.http.post(this.apiUrl, this.formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          alert('Galpão criado com sucesso!');
          this.carregarUnidades();
          this.fecharModal();
          this.isSaving.set(false);
        },
        error: (err) => {
          alert('Erro ao salvar: ' + (err.error?.message || 'Falha na rede'));
          this.isSaving.set(false);
        }
      });
  }

  deletarUnidade(id: string) {
    if (confirm('Tem certeza que deseja remover esta unidade?')) {
      this.http.delete(`${this.apiUrl}/${id}`)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => this.carregarUnidades(),
          error: (err) => alert('Erro ao excluir: ' + (err.error?.message || 'Conflito de chave'))
        });
    }
  }
}