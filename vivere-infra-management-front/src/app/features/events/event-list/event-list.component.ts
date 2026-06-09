import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MaterialService } from '../../../core/services/material.service';
import { EventService, VivereEvent } from '../../../core/services/event.service';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="page-header">
      <div class="page-header__title">
        <span class="eyebrow">Operação</span>
        <h1>Gestão de eventos</h1>
        <p class="subtitle">Controle de montagens sincronizado com a Ordem de Serviço.</p>
      </div>
      <div class="page-header__right">
        <button class="btn-primary" (click)="router.navigate(['/ordens'])">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo planejamento (OS)
        </button>
      </div>
    </header>

    <div class="filter-tabs">
      <button [class.is-active]="filter === 'ALL'" (click)="filter = 'ALL'">
        Todos <span class="count tnum">{{ events().length }}</span>
      </button>
      <button [class.is-active]="filter === 'DRAFT'" (click)="filter = 'DRAFT'">
        Rascunhos <span class="count tnum">{{ countByStatus('DRAFT') }}</span>
      </button>
      <button [class.is-active]="filter === 'ACTIVE'" (click)="filter = 'ACTIVE'">
        No Galpão <span class="count tnum">{{ countByStatus('ACTIVE') }}</span>
      </button>
      <button [class.is-active]="filter === 'RETURNED'" (click)="filter = 'RETURNED'">
        Devolvidos <span class="count tnum">{{ countByStatus('RETURNED') }}</span>
      </button>
      <button [class.is-active]="filter === 'PENDING'" (click)="filter = 'PENDING'">
        Pendentes <span class="count tnum">{{ countByStatus('PENDING') }}</span>
      </button>
      <button [class.is-active]="filter === 'READY'" (click)="filter = 'READY'">
        Aprovados <span class="count tnum">{{ countByStatus('READY') }}</span>
      </button>
    </div>

    <main class="list-main">
      <div class="card no-padding">
        <table class="data-table data-table--full">
          <thead>
            <tr>
              <th class="col-status"></th>
              <th>Evento / projeto</th>
              <th>Status (OS)</th>
              <th class="col-date">Data início</th>
              <th>Local</th>
              <th class="col-actions"></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let event of filteredEvents()" (click)="abrirEdicao(event)" class="row-clickable">
              <td class="col-status">
                <span class="status-dot" [ngClass]="event.status.toLowerCase()"></span>
              </td>
              <td>
                <div class="td-strong">{{ event.name }}</div>
                <div class="td-sub">{{ event['description'] || 'Sem fornecedor definido' }}</div>
              </td>
              <td>
                <span class="badge" [ngClass]="badgeClass(event.status)">{{ statusLabel(event.status) }}</span>
              </td>
              <td class="col-date mono">{{ event.startDate | date:'dd/MM/yyyy' }}</td>
              <td class="td-muted">{{ formatAddress(event) }}</td>
              <td class="col-actions">
                <button class="btn-icon" (click)="abrirEdicao(event); $event.stopPropagation()" title="Editar Data/Nome">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div *ngIf="filteredEvents().length === 0" class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <h3>Nenhum evento encontrado</h3>
          <p>Não há registros para este filtro.</p>
        </div>
      </div>
    </main>

    <div *ngIf="editForm" class="modal-overlay" (click)="editForm = null">
      <div class="modal" (click)="$event.stopPropagation()">
        <header class="modal__head">
          <div>
            <span class="modal__eyebrow">Editar registro</span>
            <h3>{{ editForm.name }}</h3>
          </div>
          <button class="btn-close" (click)="editForm = null" aria-label="Fechar">✕</button>
        </header>

        <div class="modal__body">

  <div class="field">
    <label>Nome do evento / projeto</label>
    <input [(ngModel)]="editForm.name" />
  </div>

  <div class="field-grid">

    <div class="field">
      <label>Status (Via Máquina de Estados)</label>

      <input
        [value]="statusLabel(editForm.status)"
        disabled
        style="background:#f1f5f9; cursor:not-allowed;"
      />

      <small
        style="
          font-size:10px;
          color:var(--vivere-orange);
          margin-top:4px;
        "
      >
        O status deve ser alterado pelo fluxo operacional da OS.
      </small>
    </div>

    <div class="field">
      <label>Data início</label>

      <input
        type="date"
        [ngModel]="editForm.startDate | date:'yyyy-MM-dd'"
        (ngModelChange)="editForm.startDate = $event"
      />
    </div>

  </div>

  <hr style="margin:20px 0">

  <h4>Detalhes Operacionais</h4>

  <div class="field-grid">

    <div class="field">
      <label>Fornecedor</label>

      <input
        [value]="editForm.supplier || '-'"
        disabled
      />
    </div>

    <div class="field">
      <label>Status da Ordem</label>

      <input
        [value]="editForm.status"
        disabled
      />
    </div>

  </div>

  <div class="field">
    <label>Observações do Galpão</label>

    <textarea
      rows="4"
      [(ngModel)]="editForm.observation">
    </textarea>
  </div>

  <hr style="margin:20px 0">
  <!-- CHECKLIST -->

<div
  *ngIf="
    isActive() ||
    isReturned() ||
    isPending() ||
    isReady()
  ">

  <h4>Checklist do Galpão</h4>

  <div class="checklist-container">

    <div
      *ngFor="
        let item of (
          isReturned()
            ? getItensPendentes()
            : editForm.items
        )
      "
      class="material-card">

      <div class="material-check">

        <input
          type="checkbox"
          [(ngModel)]="item.checked"
          [disabled]="!isActive()">

      </div>

      <div class="material-info">

        <!-- ACTIVE / PENDING / READY -->

        <ng-container *ngIf="!isReturned()">

          <div class="material-name">
            {{ item.material?.name }}
          </div>

        </ng-container>

        <!-- RETURNED -->

        <ng-container *ngIf="isReturned()">

  <label>Substituir Material</label>

  <select
    [(ngModel)]="item.materialId">

    <option
      *ngFor="let material of materiaisDisponiveis"
      [value]="material.id">

      {{ material.name }}

    </option>

  </select>

  <div class="field">

    <label>Quantidade</label>

    <input
      type="number"
      min="1"
      [(ngModel)]="item.quantity">

  </div>

</ng-container>

        <div class="material-meta">

          <span>
            Qtd: {{ item.quantity }}
          </span>

          <span>
            Estoque:
            {{ item.material?.stock }}
          </span>

        </div>

        <div
            class="material-status success"
            *ngIf="
              item.checked ||
              editForm.status === 'PENDING' ||
              editForm.status === 'READY'
            ">

            ✔ Conferido

        </div>

      <div
          class="material-status error"
          *ngIf="
            !item.checked &&
            editForm.status !== 'PENDING' &&
            editForm.status !== 'READY'
          ">

          ✖ Pendente
      </div>

      </div>

    </div>

  </div>

</div>

<!-- ACTIVE -->

<div *ngIf="isActive()">

  <button
    class="btn-primary"
    (click)="aprovarGalpao()">

    Aprovar e Enviar para Produção

  </button>

  <button
    class="btn-secondary"
    (click)="devolverGalpao()">

    Devolver para Produção

  </button>

</div>

<!-- RETURNED -->

<div *ngIf="isReturned()">

  <h4>Itens com Pendência</h4>

  <p>
    O galpão devolveu esta OS para correção.
  </p>

  <button
    class="btn-primary"
    (click)="corrigirEReenviar()">

    Corrigir e Reenviar para o Galpão

  </button>

</div>

<!-- PENDING -->

<div *ngIf="isPending()">

  <h4>Validação Final da Produção</h4>

  <div class="field">

    <label>
      Observações do Galpão
    </label>

    <textarea
      [value]="editForm.observation"
      disabled>
    </textarea>

  </div>

  <button
    class="btn-primary"
    (click)="aprovarProducao()">

    Aprovar OS

  </button>

</div>

<!-- READY -->

<div *ngIf="isReady()">

  <h4>OS Aprovada</h4>

  <p>
    Esta ordem já foi aprovada.
  </p>

  <button
  class="btn-secondary"
  (click)="exportarPdf()">

  Exportar PDF

</button>

</div>

<!-- DRAFT -->

<button
  *ngIf="editForm.status === 'DRAFT'"
  class="btn-primary"
  (click)="salvarAlteracoes()">

  Atualizar Evento

</button>

<footer class="modal__foot">

  <button
    class="btn-secondary"
    (click)="editForm = null">

    Cancelar

  </button>

</footer>
  `,
  styles: [`
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; padding: 18px 28px; background: var(--surface); border-bottom: 1px solid var(--border); }
    .page-header__title h1 { font-size: 18px; font-weight: 700; letter-spacing: -0.3px; color: var(--text-strong); margin: 0; }
    .page-header__title .subtitle { margin: 4px 0 0; font-size: 13px; color: var(--text-secondary); }
    .eyebrow { display: block; font-size: 11px; font-weight: 600; letter-spacing: 1.2px; color: var(--text-tertiary); text-transform: uppercase; margin-bottom: 3px; }
    .page-header__right { display: flex; gap: 8px; }
    .btn-primary, .btn-secondary { display: inline-flex; align-items: center; gap: 7px; padding: 8px 13px; border-radius: var(--radius); font-size: 13px; font-weight: 500; cursor: pointer; transition: all var(--duration) var(--ease); }
    .btn-primary svg, .btn-secondary svg { width: 14px; height: 14px; }
    .btn-primary { background: var(--vivere-orange); color: white; border: 1px solid var(--vivere-orange); }
    .btn-primary:hover { background: var(--vivere-orange-hover); border-color: var(--vivere-orange-hover); }
    .btn-secondary { background: var(--surface); color: var(--text-primary); border: 1px solid var(--border); }
    .btn-secondary:hover { border-color: var(--border-strong); background: var(--surface-hover); }
    .filter-tabs { display: flex; gap: 0; padding: 0 28px; background: var(--surface); border-bottom: 1px solid var(--border); }
    .filter-tabs button { display: inline-flex; align-items: center; gap: 8px; padding: 12px 14px; background: transparent; border: 0; border-bottom: 2px solid transparent; margin-bottom: -1px; font-size: 13px; font-weight: 500; color: var(--text-tertiary); cursor: pointer; transition: color var(--duration) var(--ease), border-color var(--duration) var(--ease); }
    .filter-tabs button:hover { color: var(--text-primary); }
    .filter-tabs button.is-active { color: var(--text-strong); border-bottom-color: var(--vivere-orange); }
    .count { padding: 1px 6px; background: var(--surface-sunken); border: 1px solid var(--border); border-radius: 10px; font-size: 10.5px; font-weight: 600; color: var(--text-tertiary); }
    .filter-tabs button.is-active .count { background: var(--vivere-orange-soft); color: var(--vivere-orange); border-color: var(--vivere-orange-border); }
    .list-main { padding: 20px 28px 28px; }
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); }
    .card.no-padding { padding: 0; overflow: hidden; }
    .data-table--full { width: 100%; border-collapse: collapse; font-size: 13px; }
    .data-table--full th { padding: 10px 14px; background: var(--surface-sunken); text-align: left; font-size: 10.5px; font-weight: 600; letter-spacing: 0.7px; text-transform: uppercase; color: var(--text-tertiary); border-bottom: 1px solid var(--border); }
    .data-table--full td { padding: 14px; border-bottom: 1px solid var(--border-subtle); color: var(--text-primary); vertical-align: middle; }
    .data-table--full tbody tr.row-clickable { cursor: pointer; transition: background var(--duration) var(--ease); }
    .data-table--full tbody tr:hover { background: var(--surface-hover); }
    .col-status { width: 32px; padding-left: 18px !important; }
    .col-date { white-space: nowrap; color: var(--text-secondary); }
    .col-actions { width: 50px; text-align: right; padding-right: 18px !important; }
    .status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--text-muted); }
    .status-dot.draft { background: var(--text-secondary); }
    .status-dot.pending { background: var(--status-warning); box-shadow: 0 0 0 3px var(--status-warning-bg); }
    .status-dot.active { background: var(--status-info); box-shadow: 0 0 0 3px var(--status-info-bg); }
    .status-dot.ready { background: var(--status-success); box-shadow: 0 0 0 3px var(--status-success-bg); }
    .td-strong { font-weight: 500; color: var(--text-primary); }
    .td-sub { font-size: 12px; color: var(--text-tertiary); margin-top: 2px; max-width: 380px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .td-muted { color: var(--text-tertiary); }
    .mono { font-family: var(--font-mono); font-variant-numeric: tabular-nums; font-size: 12.5px; }
    .badge { display: inline-block; padding: 2px 8px; font-size: 10.5px; font-weight: 600; letter-spacing: 0.4px; text-transform: uppercase; border-radius: var(--radius-sm); border: 1px solid; }
    .badge.draft { color: var(--text-secondary); background: var(--surface-hover); border-color: var(--border-strong); }
    .badge.active { color: var(--status-info); background: var(--status-info-bg); border-color: var(--status-info-border); }
    .badge.pending { color: var(--status-warning); background: var(--status-warning-bg); border-color: var(--status-warning-border); }
    .badge.ready { color: var(--status-success); background: var(--status-success-bg); border-color: var(--status-success-border); }
    .btn-icon { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; background: transparent; border: 1px solid transparent; border-radius: var(--radius-sm); color: var(--text-tertiary); cursor: pointer; transition: all var(--duration) var(--ease); }
    .btn-icon svg { width: 14px; height: 14px; }
    .btn-icon:hover { background: var(--surface-sunken); border-color: var(--border); color: var(--text-primary); }
    .empty-state { padding: 80px 20px; text-align: center; color: var(--text-tertiary); }
    .empty-state svg { width: 36px; height: 36px; color: var(--text-muted); padding: 12px; background: var(--surface-sunken); border: 1px solid var(--border); border-radius: 50%; box-sizing: content-box; margin: 0 auto 14px; display: block; }
    .empty-state h3 { margin: 0 0 4px; font-size: 14px; font-weight: 600; color: var(--text-primary); }
    .empty-state p { margin: 0; font-size: 13px; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(15,15,15,0.55); display: flex; align-items: center; justify-content: center; z-index: 3000; backdrop-filter: blur(2px); animation: fadeIn 150ms var(--ease); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .modal { width: 900px;max-width: calc(100% - 40px);max-height: 90vh;overflow-y: auto;background: var(--surface);border: 1px solid var(--border);border-radius: var(--radius-lg);box-shadow: var(--shadow-modal);display: flex;flex-direction: column;animation: scaleIn 150ms var(--ease);}    @keyframes scaleIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
    .modal__head { padding: 18px 22px; border-bottom: 1px solid var(--border); display: flex; align-items: flex-start; justify-content: space-between; }
    .modal__eyebrow { display: block; font-size: 10.5px; font-weight: 600; letter-spacing: 1.2px; text-transform: uppercase; color: var(--vivere-orange); margin-bottom: 4px; }
    .modal__head h3 { margin: 0; font-size: 16px; font-weight: 600; color: var(--text-strong); }
    .material-card{display:flex;align-items:center;gap:16px;padding:12px 16px;border:1px solid var(--border);border-radius:12px;background:#fff;transition:.2s;}
    .material-card:hover{transform:translateY(-1px);}
    .material-check{flex-shrink:0;}
    .material-info{flex:1;}
    .material-name{font-weight:600;font-size:14px;}
    .material-meta{display:flex;gap:20px;margin-top:4px;font-size:12px;color:#64748b;}
    .material-status {margin-top: 6px;font-size: 12px;font-weight: 600;}
    .material-status.success {color: #16a34a;}
    .material-status.error {color: #dc2626;}
    .btn-close { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; background: transparent; border: 1px solid transparent; border-radius: var(--radius-sm); color: var(--text-tertiary); cursor: pointer; transition: all var(--duration) var(--ease); }
    .btn-close:hover { background: var(--surface-sunken); color: var(--text-primary); border-color: var(--border); }
    .modal__body { padding: 20px 22px; display: flex; flex-direction: column; gap: 16px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field label { font-size: 11.5px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; color: var(--text-secondary); }
    .field input, .field select, .field textarea { padding: 9px 11px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); font-size: 13.5px; color: var(--text-primary); transition: border-color var(--duration) var(--ease); }
    .field input:focus { outline: none; border-color: var(--vivere-orange); box-shadow: 0 0 0 3px rgba(255,102,0,0.12); }
    .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .modal__foot { padding: 14px 22px; border-top: 1px solid var(--border); background: var(--surface-sunken); display: flex; justify-content: flex-end; gap: 8px; }
    .checklist-container{max-height:300px;overflow-y:auto;display:flex;flex-direction:column;gap:10px;}    .checklist-container table {width: 100%;border-collapse: collapse;}
    .checklist-container th,
    .checklist-container td {padding: 8px 10px;border-bottom: 1px solid var(--border-subtle);}
    .checklist-container thead th {position: sticky;top: 0;background: var(--surface-sunken);z-index: 5;}
    .checklist-container tbody tr:hover {background: var(--surface-hover);}
    .checklist-item{display:flex;align-items:center;gap:16px;padding:10px;border-bottom:1px solid var(--border-subtle);}
    .check-col{flex:1;}
    .check-col.material{flex:3;font-weight:600;}
  `]
})
export class EventListComponent implements OnInit {
  private eventService = inject(EventService);
  public router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private materialService = inject(MaterialService);

  materiaisDisponiveis: any[] = [];

  filter = 'ALL';
  events = signal<any[]>([]);
  editForm: any | null = null; 

  ngOnInit() {

  this.loadEvents();

  this.materialService.getMaterials().subscribe({
    next: (data) => {
      this.materiaisDisponiveis = data;
    },
    error: (err) => {
      console.error('Erro ao carregar materiais', err);
    }
  });

}

  loadEvents() {
    this.eventService.getEvents()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.events.set(data),
        error: (err) => console.error('Erro ao carregar eventos:', err)
      });
  }

  filteredEvents() {
    if (this.filter === 'ALL') return this.events();
    return this.events().filter(e => e.status === this.filter);
  }

  countByStatus(status: string): number {
    return this.events().filter(e => e.status === status).length;
  }

  statusLabel(status: string): string {
  return ({
    DRAFT: 'Rascunho',
    ACTIVE: 'No Galpão',
    RETURNED: 'Devolvido',
    PENDING: 'Aguardando Aprovação',
    READY: 'Aprovado'
    } as Record<string,string>)[status] || status;
  }

  badgeClass(status: string): string {
    return status.toLowerCase();
  }

  formatAddress(event: any): string {
    if (event.address?.city) {
      return event.address.state ? `${event.address.city} - ${event.address.state}` : event.address.city;
    }
    return '—';
  }

  abrirEdicao(event: any) {
    console.log('EVENTO', event);
    console.log('ITENS', event.items);
    console.log('ID OS', event.osId)
    this.editForm = { 
      ...event,
      id: event.osId
    };
  }

  salvarAlteracoes() {
  if (this.editForm && this.editForm.id) {
    let startStr = this.editForm.startDate as string;
    if (!startStr.includes('T')) {
      startStr += 'T12:00:00';
    }
    const payloadLimpo: any = {
      eventName: this.editForm.name,
      startDate: new Date(startStr).toISOString()
    };
    // Se for uma OS devolvida, envia também os itens corrigidos
    if (this.editForm.status === 'RETURNED') {
      payloadLimpo.items =
        this.editForm.items.map((item: any) => ({
          materialId: item.materialId,
          operationalUnitId: item.operationalUnitId,
          quantity: item.quantity
        }));
    }
    console.log('EVENT ID:', this.editForm.id);
    console.log('OS ID:', this.editForm.osId);
    console.log('PAYLOAD:', payloadLimpo);
    this.eventService
      .updateEvent(
        this.editForm.osId,
        payloadLimpo
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          alert(
            '✅ Registro atualizado com sucesso!'
          );
          this.editForm = null;
          this.loadEvents();
        },
        error: (err: any) => {
          alert(
            '❌ Erro ao salvar: ' +
            (err.error?.message || err.message)
          );
        }
      });
  }
}

exportarPdf() {
  const pdf = new jsPDF();
  pdf.text(
    `OS: ${this.editForm.name}`,
    10,
    10
  );
  pdf.save(
    `OS-${this.editForm.name}.pdf`
  );
}

  corrigirEReenviar() {
  if (!this.editForm?.osId) {
    alert('OS não encontrada.');
    return;
  }
  let startStr = this.editForm.startDate as string;
  if (!startStr.includes('T')) {
    startStr += 'T12:00:00';
  }
  const payload: any = {
    eventName: this.editForm.name,
    startDate: new Date(startStr).toISOString(),

    items: this.editForm.items.map(
      (item: any) => ({
        materialId: item.materialId,
        operationalUnitId: item.operationalUnitId,
        quantity: item.quantity
      })
    )
  };
  this.eventService
    .updateEvent(
      this.editForm.osId,
      payload
    )
    .subscribe({
      next: () => {
        this.eventService
          .resubmitOrder(
            this.editForm.osId
          )
          .subscribe({
            next: () => {
              alert(
                '✅ Correções enviadas para o Galpão.'
              );
              this.editForm = null;
              this.loadEvents();
            },
            error: (err) => {
              console.error(err);
              alert(
                'Erro ao reenviar para o Galpão.'
              );
            }
          });
      },
      error: (err) => {
        console.error(err);
        alert(
          'Erro ao salvar alterações.'
        );
      }
    });
}

  aprovarGalpao() {

  if (!this.editForm?.osId) {
    alert('OS não encontrada.');
    return;
  }

  const checkedItems =
  this.editForm.items
    ?.filter((i: any) => i.checked)
    .map((i: any) => i.id) || [];

  console.log('CHECKED ITEMS:', checkedItems);
  console.log('ITENS DA OS:', this.editForm.items);

  const dto = {
    observation: this.editForm.observation,
    checkedItems
  };

  this.eventService
    .reviewOrder(this.editForm.osId, dto)
    .subscribe({
      next: () => {
        alert('✅ OS aprovada e enviada para Produção');
        this.editForm = null;
        this.loadEvents();
      },
      error: (err) => {
        console.error(err);
        alert('Erro ao aprovar OS');
      }
    });
}

devolverGalpao() {
  if (!this.editForm?.osId) {
    alert('OS não encontrada.');
    return;
  }

  const dto = {
    observation: this.editForm.observation,
    checkedItems: []
  };

  this.eventService
    .reviewOrder(this.editForm.osId, dto)
    .subscribe({
      next: () => {
        alert('↩️ OS devolvida para Produção');
        this.editForm = null;
        this.loadEvents();
      },
      error: (err) => {
        console.error(err);
        alert('Erro ao devolver OS');
      }
    });
}

aprovarProducao() {

  if (!this.editForm?.osId) {
    alert('OS não encontrada.');
    return;
  }

  this.eventService
    .aprovarProducao(this.editForm.osId)
    .subscribe({
      next: () => {
        alert('✅ OS aprovada com sucesso');

        this.editForm = null;

        this.loadEvents();
      },

      error: (err) => {
        console.error(err);

        alert(
          err.error?.message ||
          'Erro ao aprovar OS'
        );
      }
    });
}
reenviarGalpao() {

  if (!this.editForm?.osId) {
    return;
  }

  this.eventService
    .resubmitOrder(this.editForm.osId)
    .subscribe({

      next: () => {

        alert(
          'OS reenviada ao Galpão.'
        );

        this.editForm = null;

        this.loadEvents();
      },

      error: (err) => {

        console.error(err);

        alert(
          'Erro ao reenviar.'
        );
      }
    });
}
getItensPendentes() {

  console.log(
    'ITEMS DA OS',
    this.editForm?.items
  );

  return this.editForm?.items?.filter(
    (item: any) => item.unavailable
  ) || [];

}
isReturned() {
  return this.editForm?.status === 'RETURNED';
}

isPending() {
  return this.editForm?.status === 'PENDING';
}

isActive() {
  return this.editForm?.status === 'ACTIVE';
}

isReady() {
  return this.editForm?.status === 'READY';
}
}