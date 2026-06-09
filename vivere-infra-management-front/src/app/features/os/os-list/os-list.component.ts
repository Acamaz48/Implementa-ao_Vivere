import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MaterialService } from '../../../core/services/material.service';
import { ServiceOrderService, CreateOsPayload } from '../../../core/services/service-order.service';
import { OperationalUnitService } from '../../../core/services/operational-unit.service';

@Component({
  selector: 'app-os-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="control-panel no-print">
      <header class="page-header">
        <div class="page-header__title">
          <span class="eyebrow">Documento operacional</span>
          <h1>{{ osAtual ? 'Gestão da Ordem de Serviço' : 'Nova ordem de serviço' }}</h1>
          <p class="subtitle">{{ osAtual ? 'Acompanhe o status logístico e liberação de estoque.' : 'Carga, montagem e logística do evento.' }}</p>
        </div>
        <div class="page-header__right">
          <div class="meta-pill" *ngIf="!osAtual">
            <span class="meta-pill__label">Emissão</span>
            <span class="meta-pill__value mono">{{ today | date:'dd/MM/yyyy' }}</span>
          </div>
          <button class="btn-secondary" *ngIf="osAtual" (click)="voltarParaCriacao()">+ Nova OS</button>
        </div>
      </header>

      <section class="status-section" *ngIf="osAtual">
        <div class="status-info">
          <h2>OS ID: {{ osAtual.id }}</h2>
          <span class="badge" 
                [ngClass]="{
                  'badge--neutral': osAtual.status === 'DRAFT',
                  'badge--info': osAtual.status === 'ACTIVE',
                  'badge--warn': osAtual.status === 'PENDING',
                  'badge--success': osAtual.status === 'READY'
                }">
            STATUS ATUAL: {{ osAtual.status }}
          </span>
        </div>

        <div class="status-guide">
          <strong>Guia de Fluxo:</strong> 
          <span>DRAFT: Rascunho</span> | 
          <span>ACTIVE: No Galpão</span> | 
          <span>PENDING: Retornou</span> | 
          <span>READY: Aprovada</span>
        </div>

        <div class="action-buttons">
          <button class="btn-action btn-info" *ngIf="osAtual.status === 'DRAFT' || osAtual.status === 'PENDING'" (click)="submeterOS()">
            📤 Enviar p/ Galpão (ACTIVE)
          </button>
          <button class="btn-action btn-warn" *ngIf="osAtual.status === 'ACTIVE'" (click)="submeterOS()">
            🛠️ Processar e Devolver (PENDING)
          </button>
          <button class="btn-action btn-success" *ngIf="osAtual.status === 'PENDING'" (click)="finalizarAprovacao()">
            ✅ Finalizar e Aprovar OS (READY)
          </button>
          <button class="btn-print-action" onclick="window.print()">🖨️ Imprimir / Gerar PDF</button>
        </div>
      </section>

      <section class="inventory-section" *ngIf="!osAtual">
        <div class="inventory-grid">
          <div class="field-control">
            <label>Unidade Operacional / Galpão</label>
            <select [(ngModel)]="selectedOperationalUnitId">
              <option value="">Selecione a unidade</option>
              <option *ngFor="let unit of operationalUnits()" [value]="unit.id">{{ unit.name }}</option>
            </select>
          </div>

          <div class="field-control">
            <label>Adicionar ao Documento</label>
            <div class="add-row-container">
              <select [(ngModel)]="tipoSelecionado" class="select-type">
                <option value="estrutura">🏗️ Estrutura</option>
                <option value="material">📦 Material Avulso</option>
              </select>

              <select *ngIf="tipoSelecionado === 'estrutura'" [(ngModel)]="estruturaSelecionadaId" class="select-item">
                <option value="">— Escolha uma estrutura —</option>
                <option *ngFor="let est of estruturasDoBanco()" [value]="est.id">{{ est.name }}</option>
              </select>

              <select *ngIf="tipoSelecionado === 'material'" [(ngModel)]="materialSelecionadoId" class="select-item">
                <option value="">— Escolha um material —</option>
                <option *ngFor="let mat of materiaisDoBanco()" [value]="mat.id">{{ mat.name }}</option>
              </select>

              <button class="btn-add-item" (click)="tipoSelecionado === 'material' ? addMaterialAvulso() : addEstrutura()">
                Adicionar
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <main class="os-page">
      <div class="a4-container">
        
        <div class="logo-box">
          <img src="assets/vivere_logo.png" alt="Vivere Logo" class="logo-vivere" onerror="this.style.display='none'">
          <div class="os-title">ORDEM DE SERVIÇO - E.D</div>
        </div>

        <table>
          <colgroup>
            <col style="width: 15%;">
            <col style="width: 50%;">
            <col style="width: 15%;">
            <col style="width: 20%;">
          </colgroup>
          <tr>
            <td class="label">FORNECEDOR:</td>
            <td>
              <input type="text" [(ngModel)]="osForm.organizador" placeholder="Digite o nome do fornecedor" [disabled]="osAtual">
            </td>
            <td class="label" style="text-align: right;">Nº DA OS:</td>
            <td>
              <input type="text" [value]="osAtual ? osAtual.id : 'OS XXX (SIGLA)'" style="font-weight: bold;" readonly>
            </td>
          </tr>
          <tr>
            <td colspan="2"></td>
            <td class="label" style="text-align: right;">DATA DA OS:</td>
            <td>
              <input type="date" [value]="today | date:'yyyy-MM-dd'" readonly>
            </td>
          </tr>
        </table>

        <table>
          <tr><td colspan="4" class="header-section">DADOS DO EVENTO</td></tr>
          <tr>
            <td class="label">EVENTO:</td>
            <td style="width: 40%;">
              <input type="text" [(ngModel)]="osForm.nome" [disabled]="osAtual">
            </td>
            <td class="label">SOLICITANTE:</td>
            <td>
              <input type="text" [(ngModel)]="osForm.solicitante" [disabled]="osAtual">
            </td>
          </tr>
          <tr>
            <td class="label">DATA EVENTO:</td>
            <td>
              <input type="date" [(ngModel)]="osForm.dataEvento" [disabled]="osAtual">
            </td>
            <td class="label">RESPONSÁVEL:</td>
            <td>
              <input type="text" [(ngModel)]="osForm.responsavel" [disabled]="osAtual">
            </td>
          </tr>
          <tr>
            <td class="label">LOCAL:</td>
            <td>
              <input type="text" [(ngModel)]="osForm.local" [disabled]="osAtual">
            </td>
            <td class="label">CONTATO:</td>
            <td>
              <input type="text" [(ngModel)]="osForm.contato" [disabled]="osAtual">
            </td>
          </tr>
          <tr>
            <td class="label">HORÁRIO:</td>
            <td colspan="3">
              <input type="text" [(ngModel)]="osForm.horario" [disabled]="osAtual">
            </td>
          </tr>
        </table>

        <table>
          <tr><td colspan="4" class="header-section">LOGÍSTICA DE MONTAGEM E DESMONTAGEM</td></tr>
          <tr>
            <td class="label">INÍCIO MONTAGEM:</td>
            <td>
              <input type="datetime-local" [(ngModel)]="osForm.dataInicio" [disabled]="osAtual">
            </td>
            <td class="label">RESP. TÉCNICO:</td>
            <td>
              <input type="text" [(ngModel)]="osForm.respTecnico" [disabled]="osAtual">
            </td>
          </tr>
          <tr>
            <td class="label">ENTREGA:</td>
            <td>
              <input type="datetime-local" [(ngModel)]="osForm.entrega" [disabled]="osAtual">
            </td>
            <td class="label">CONTATO TÉC:</td>
            <td>
              <input type="text" [(ngModel)]="osForm.contatoTec" [disabled]="osAtual">
            </td>
          </tr>
          <tr>
            <td class="label">DESMONTAGEM:</td>
            <td colspan="3">
              <input type="datetime-local" [(ngModel)]="osForm.dataFim" [disabled]="osAtual">
            </td>
          </tr>
        </table>

        <table>
          <tr><td class="header-section">OBSERVAÇÕES GERAIS</td></tr>
          <tr>
            <td style="padding: 0;">
              <textarea [(ngModel)]="osForm.descricao" placeholder="Inserir observações adicionais aqui..." [disabled]="osAtual"></textarea>
            </td>
          </tr>
        </table>

        <table id="os-items">
          <thead>
            <tr>
              <th class="header-table" style="width: 40%;">DESCRIÇÃO DOS SERVIÇOS / ITENS</th>
              <th class="header-table" style="width: 10%;">UNID.</th>
              <th class="header-table" style="width: 10%;">DIÁRIAS</th>
              <th class="header-table" style="width: 10%;">QTDE.</th>
              <th class="header-table" style="width: 15%;">VLR UNIT.</th>
              <th class="header-table" style="width: 15%;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            <ng-container *ngFor="let est of estruturasAdicionadas(); let gIndex = index">
              <tr class="row-group-title">
                <td colspan="6">
                  <strong>{{ est.isMaterialAvulso ? '📦 MATERIAIS AVULSOS' : '🏗️ ESTRUTURA: ' + est.name }}</strong>
                  <button class="btn-remove-item no-print" (click)="removeEstrutura(gIndex)" *ngIf="!osAtual">Remover Grupo</button>
                </td>
              </tr>
              <tr *ngFor="let item of est.templates">
                <td>
                  <input type="text" [value]="getNomeMaterial(item.materialId)" readonly style="font-weight: 500;">
                </td>
                <td>
                  <input type="text" value="UN" style="text-align: center;" readonly>
                </td>
                <td>
                  <input type="number" class="calc row-diaria" min="0" value="1" [disabled]="osAtual">
                </td>
                <td>
                  <input type="number" [(ngModel)]="item.quantity" class="calc row-qty" min="1" style="text-align: center;" [disabled]="osAtual">
                </td>
                <td>
                  <input type="number" class="calc row-price" step="0.01" min="0" placeholder="0.00" style="text-align: right;" [disabled]="osAtual">
                </td>
                <td>
                  <input type="text" class="row-total val-total" value="0,00" readonly>
                </td>
              </tr>
            </ng-container>

            <tr *ngIf="estruturasAdicionadas().length === 0">
              <td colspan="6" style="text-align: center; padding: 15px; color: #777; font-style: italic;">
                Nenhum item adicionado. Use os controles administrativos acima.
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="5" style="text-align: right; font-weight: bold; font-size: 13px; background-color: #f2f2f2;">VALOR TOTAL DA ORDEM DE SERVIÇO: R$</td>
              <td id="grand-total" style="font-size: 13px; font-weight: 900; text-align: right; background-color: #e6e6e6;">0,00</td>
            </tr>
          </tfoot>
        </table>

        <div class="footer-banner">
          EM CASO DE EMERGÊNCIA OU DÚVIDAS DURANTE O EVENTO (FINAIS DE SEMANA), CONTATAR O PLANTÃO O.S: (21) 96473-3032
        </div>
      </div>

      <footer class="os-doc__foot no-print" *ngIf="!osAtual">
        <div class="foot-summary">
          <span class="foot-label">Total de Estruturas / Grupos</span>
          <span class="foot-value mono">{{ estruturasAdicionadas().length }}</span>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn-print-action" style="padding: 12px 25px;" onclick="window.print()">🖨️ Visualizar Impressão</button>
          <button class="btn-save-draft" [disabled]="isSaving()" (click)="finalizarOS()">
            <span>{{ isSaving() ? 'Salvando...' : 'Salvar OS como Rascunho (DRAFT)' }}</span>
          </button>
        </div>
      </footer>
    </main>
  `,
  styles: [`
    /* RESET E AJUSTES DE IMPRESSÃO EM ADESÃO AS CONFIGURAÇÕES GLOBAIS */
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

    :host {
      --font-family: 'Segoe UI', Calibri, Arial, sans-serif;
      --border-color: #000000;
      --header-bg: #d9d9d9;
      --label-bg: #f2f2f2;
    }

    /* ESTILOS INTERNOS DA INTERFACE DO SISTEMA (NÃO SAEM NO PAPEL) */
    .control-panel { padding: 20px 30px; background: #f8f9fa; border-bottom: 1px solid #dee2e6; font-family: var(--font-family); }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
    .eyebrow { display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #6c757d; }
    .page-header__title h1 { margin: 5px 0 0; font-size: 20px; color: #212529; }
    .page-header__title .subtitle { margin: 2px 0 0; font-size: 13px; color: #6c757d; }
    .meta-pill { background: #fff; padding: 6px 12px; border: 1px solid #ced4da; border-radius: 4px; text-align: center; }
    .meta-pill__label { font-size: 10px; text-transform: uppercase; display: block; color: #6c757d; }
    .meta-pill__value { font-weight: bold; font-size: 13px; }
    
    .status-section { background: #fff; border: 1px solid #ced4da; padding: 15px; border-radius: 6px; margin-bottom: 15px; }
    .status-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .status-info h2 { margin: 0; font-size: 16px; }
    .status-guide { font-size: 12px; color: #495057; margin-bottom: 15px; }
    
    .action-buttons { display: flex; gap: 10px; }
    .btn-action { padding: 8px 16px; border: none; border-radius: 4px; color: #fff; font-weight: 600; cursor: pointer; }
    .btn-info { background: #17a2b8; }
    .btn-warn { background: #ffc107; color: #000; }
    .btn-success { background: #198754; }
    
    .inventory-section { background: #fff; border: 1px solid #ced4da; padding: 15px; border-radius: 6px; }
    .inventory-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 20px; align-items: end; }
    .field-control { display: flex; flex-direction: column; gap: 5px; }
    .field-control label { font-size: 12px; font-weight: 600; color: #495057; }
    .field-control select { padding: 8px; border: 1px solid #ced4da; border-radius: 4px; background: #fff; }
    
    .add-row-container { display: flex; gap: 8px; }
    .select-type { width: 140px; }
    .select-item { flex: 1; }
    .btn-add-item { background: #6c757d; color: #fff; border: none; padding: 0 15px; border-radius: 4px; font-weight: 600; cursor: pointer; }
    .btn-add-item:hover { background: #5a6268; }

    .btn-secondary { background: #fff; border: 1px solid #ced4da; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-weight: 600; }
    .btn-remove-item { float: right; background: transparent; border: 1px solid #dc3545; color: #dc3545; padding: 2px 8px; font-size: 11px; border-radius: 3px; cursor: pointer; font-weight: normal; }
    .btn-remove-item:hover { background: #dc3545; color: #fff; }

    .os-doc__foot { width: 210mm; display: flex; justify-content: space-between; align-items: center; margin-top: 15px; background: #fff; padding: 15px 0; border-top: 1px solid #dee2e6; }
    .foot-summary { display: flex; flex-direction: column; }
    .foot-label { font-size: 11px; text-transform: uppercase; color: #6c757d; }
    .foot-value { font-size: 20px; font-weight: bold; }
    .btn-save-draft { background: #ff6600; color: #fff; border: none; padding: 12px 25px; border-radius: 4px; font-weight: bold; cursor: pointer; }
    .btn-save-draft:hover { background: #e65c00; }
    .btn-save-draft:disabled { background: #e9ecef; color: #adb5bd; cursor: not-allowed; }

    .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    .badge--neutral { background: #e9ecef; color: #495057; }
    .badge--info { background: #cff4fc; color: #055160; }
    .badge--warn { background: #fff3cd; color: #664d03; }
    .badge--success { background: #d1e7dd; color: #0f5132; }

    /* ESTILOS DE RENDERIZAÇÃO DA FOLHA A4 (PIXEL PERFECT / VALOR REAL) */
    .os-page { background-color: #1e1e1e; padding: 20px 0; display: flex; flex-direction: column; align-items: center; min-height: calc(100vh - 100px); overflow-y: auto; }
    .a4-container { width: 210mm; min-height: 297mm; background-color: #ffffff; padding: 10mm 12mm; box-shadow: 0 0 20px rgba(0, 0, 0, 0.7); position: relative; }

    table { width: 100%; border-collapse: collapse; margin-bottom: 5px; table-layout: fixed; }
    td, th { border: 1px solid var(--border-color); padding: 4px 6px; font-size: 11px; color: #000000; vertical-align: middle; overflow: hidden; font-family: var(--font-family); }

    .header-section { background-color: var(--header-bg); font-weight: bold; text-transform: uppercase; font-size: 11px; text-align: left; letter-spacing: 0.5px; }
    .label { background-color: var(--label-bg); font-weight: bold; width: 120px; }
    .header-table { background-color: #404040; color: #ffffff; font-weight: bold; text-align: center; text-transform: uppercase; font-size: 10px; }
    
    .row-group-title { background-color: #f9f9f9; }
    .row-group-title td { font-size: 11px; padding: 6px; border-bottom: 2px solid #000; }

    input, textarea { width: 100%; border: none; background: transparent; font-family: var(--font-family); font-size: 11px; padding: 2px; outline: none; color: #000000; }
    textarea { resize: none; height: 80px; display: block; }
    input:disabled, textarea:disabled { color: #000000 !important; -webkit-text-fill-color: #000000 !important; opacity: 1 !important; }
    
    .val-total { text-align: right; font-weight: bold; background-color: #f9f9f9; }
    .logo-box { display: flex; align-items: center; justify-content: space-between; padding-bottom: 10px; }
    .logo-vivere { height: 60px; }
    .os-title { font-size: 20px; font-weight: 800; border: 2px solid #000; padding: 5px 15px; font-family: var(--font-family); }
    .footer-banner { margin-top: 10px; border: 1px solid var(--border-color); background-color: var(--label-bg); text-align: center; font-weight: bold; font-size: 10px; padding: 8px; font-family: var(--font-family); }
    .btn-print-action { background-color: #005a9e; color: white; border: none; padding: 8px 16px; border-radius: 4px; font-weight: bold; cursor: pointer; font-family: var(--font-family); font-size: 13px; }
    .btn-print-action:hover { background-color: #004578; }

    /* MEDIA QUERIES E COMPORTAMENTO MECÂNICO DE IMPRESSÃO */
    @media print {
      body { background: none; padding: 0; }
      .os-page { background: none; padding: 0; display: block; min-height: auto; overflow-y: visible; }
      .no-print { display: none !important; }
      .a4-container { box-shadow: none; margin: 0; width: 100%; height: auto; padding: 10mm 12mm; }
      input::-webkit-calendar-picker-indicator { display: none; }
      input:disabled, textarea:disabled { color: #000000 !important; -webkit-text-fill-color: #000000 !important; }
    }
  `]
})
export class OSListComponent implements OnInit {
  private materialService = inject(MaterialService);
  private osService = inject(ServiceOrderService);
  private operationalUnitService = inject(OperationalUnitService);
  public router = inject(Router);
  private destroyRef = inject(DestroyRef);

  today = new Date();
  isSaving = signal(false);
  osAtual: any = null;
  
  estados = [ 'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO' ];

  osForm = { 
    // Propriedades nativas para sincronismo com o Payload do Back-end
    nome: '', 
    organizador: '', 
    dataInicio: '', 
    dataFim: '', 
    street: '', 
    city: '', 
    state: '', 
    zipCode: '', 
    descricao: '',

    // Propriedades visuais estritas injetadas para conformidade com a Imagem 2
    solicitante: '',
    dataEvento: '',
    responsavel: '',
    local: '',
    contato: '',
    horario: '',
    entrega: '',
    respTecnico: '',
    contatoTec: ''
  };

  estruturasDoBanco = signal<any[]>([]);
  materiaisDoBanco = signal<any[]>([]);
  estruturaSelecionadaId = '';
  tipoSelecionado = 'estrutura';
  materialSelecionadoId = '';
  materiaisAvulsos = signal<any[]>([]);
  estruturasAdicionadas = signal<any[]>([]);
  selectedOperationalUnitId = '';
  operationalUnits = signal<any[]>([]);

  ngOnInit() {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.warn('Sem token ativo no localStorage.');
      return;
    }

    this.operationalUnitService.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.operationalUnits.set(data);
          if (data.length > 0) {
            this.selectedOperationalUnitId = data[0].id;
          }
        },
        error: (err) => console.error(err)
      });

    this.materialService.getStructures()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => this.estruturasDoBanco.set(data));
      
    this.materialService.getMaterials()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => this.materiaisDoBanco.set(data));
  }

  getNomeMaterial(id: string): string {
    const mat = this.materiaisDoBanco().find(m => m.id === id);
    return mat ? mat.name : 'Material Desconhecido';
  }

  addEstrutura() {
    if (!this.estruturaSelecionadaId) return;
    const estrutura = this.estruturasDoBanco().find(e => e.id === this.estruturaSelecionadaId);
    if (estrutura) {
      // Clona profundamente o objeto para evitar mutação direta de referências de memória dos signals
      const estruturaClonada = JSON.parse(JSON.stringify(estrutura));
      this.estruturasAdicionadas.update(prev => [...prev, { ...estruturaClonada, isMaterialAvulso: false }]);
      this.estruturaSelecionadaId = '';
    }
  }

  addMaterialAvulso() {
    const material = this.materiaisDoBanco().find((m: any) => m.id === this.materialSelecionadoId);
    if (!material) return;
    
    this.estruturasAdicionadas.update(lista => {
      const existente = lista.find(item => item.id === material.id && item.isMaterialAvulso);
      if (existente) {
        existente.templates[0].quantity++;
        return [...lista];
      }
      return [
        ...lista,
        {
          id: material.id,
          name: material.name,
          isMaterialAvulso: true,
          templates: [{ materialId: material.id, quantity: 1 }]
        }
      ];
    });

    this.materialSelecionadoId = '';
  }

  removeEstrutura(index: number) {
    this.estruturasAdicionadas.update(prev => prev.filter((_, i) => i !== index));
  }

  prepararPayloadItens() {
    const contadorMateriais: Record<string, number> = {};

    this.estruturasAdicionadas().forEach(est => {
      if (est.templates) {
        est.templates.forEach((template: any) => {
          const id = template.materialId;
          contadorMateriais[id] = (contadorMateriais[id] || 0) + template.quantity;
        });
      }
    });

    return Object.keys(contadorMateriais).map(materialId => ({
      materialId: materialId,
      operationalUnitId: this.selectedOperationalUnitId,
      quantity: contadorMateriais[materialId]
    }));
  }

  finalizarOS() {
    if (!this.osForm.nome || (!this.osForm.dataInicio && !this.osForm.dataEvento)) {
      alert("⚠️ Preencha pelo menos o Nome do Evento e as Datas Operacionais."); 
      return;
    }

    this.isSaving.set(true);

    // Mapeamento e normalização temporal ISO para compatibilidade com o backend
    let startStr = this.osForm.dataInicio ? this.osForm.dataInicio : this.osForm.dataEvento;
    if (!startStr.includes('T')) startStr += 'T12:00:00';
    
    let endStr = this.osForm.dataFim ? this.osForm.dataFim : startStr;
    if (!endStr.includes('T')) endStr += 'T12:00:00';

    const unifiedPayload: CreateOsPayload = {
      eventName: this.osForm.nome,
      startDate: new Date(startStr).toISOString(),
      endDate: new Date(endStr).toISOString(),
      supplier: this.osForm.organizador,
      // Fallback inteligente para chaves obrigatórias do backend não mapeadas visualmente na imagem 2
      street: this.osForm.street || this.osForm.local,
      city: this.osForm.city || 'Rio de Janeiro',
      state: this.osForm.state || 'RJ',
      zipCode: this.osForm.zipCode || '00000-000',
      items: this.prepararPayloadItens()
    };

    this.osService.createOS(unifiedPayload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (osCriada) => {
          alert("✅ Ordem de Serviço e Evento criados com sucesso (Status: DRAFT).");
          this.osAtual = osCriada;
          this.isSaving.set(false);
        },
        error: (err) => { 
          alert("❌ Falha ao criar OS: " + (err.error?.message || 'Erro desconhecido de rede.')); 
          this.isSaving.set(false); 
        }
      });
  }

  submeterOS() {
    this.osService.submitOS(this.osAtual.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (osAtualizada) => {
          this.osAtual = osAtualizada;
          alert(`✅ Status da OS mudou para: ${osAtualizada.status}`);
        },
        error: (err) => alert(err.error?.message || "Erro ao submeter requisição.")
      });
  }

  finalizarAprovacao() {
    this.osService.finalizeOS(this.osAtual.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (osAtualizada) => {
          this.osAtual = osAtualizada;
          alert("✅ OS Validada e Pronta para Carregamento (READY)!");
        },
        error: (err) => alert(err.error?.message || "Erro ao finalizar fluxo da OS.")
      });
  }

  voltarParaCriacao() {
    this.osAtual = null;
    this.osForm = { 
      nome: '', organizador: '', dataInicio: '', dataFim: '', street: '', city: '', state: '', zipCode: '', descricao: '',
      solicitante: '', dataEvento: '', responsavel: '', local: '', contato: '', horario: '', entrega: '', respTecnico: '', contatoTec: ''
    };
    this.estruturasAdicionadas.set([]);
  }
}