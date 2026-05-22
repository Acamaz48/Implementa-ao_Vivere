import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OperationalUnitService } from '../../core/services/operational-unit.service';

export interface OsItemPayload {
  materialId: string;
  operationalUnitId: string;
  quantity: number;
}

// CORREÇÃO DE ARQUITETURA:
// O Payload agora carrega dados do Evento + Unidade Operacional + OS
export interface CreateOsPayload {
  eventName: string;
  startDate: string;
  endDate: string;

  supplier?: string;

  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;

  latitude?: number;
  longitude?: number;

  // NOVO
  operationalUnitId?: string;

  items: OsItemPayload[];
}

@Injectable({ providedIn: 'root' })
export class ServiceOrderService {
  private http = inject(HttpClient);

  // NOVO
  private operationalUnitService = inject(OperationalUnitService);

  private apiUrl = 'http://localhost:8081/service-orders';

  // NOVO
  operationalUnits = signal<any[]>([]);

  // NOVO
  selectedOperationalUnitId = signal<string>('');

  constructor() {
    this.loadOperationalUnits();
  }

  // ==========================================
  // 🏭 CARREGAR UNIDADES OPERACIONAIS
  // ==========================================

  loadOperationalUnits() {
    this.operationalUnitService.getAll()
      .subscribe({
        next: (data) => {
          this.operationalUnits.set(data);

          // Seleciona automaticamente a primeira unidade disponível
          if (data.length > 0) {
            this.selectedOperationalUnitId.set(data[0].id);
          }
        },
        error: (err) => {
          console.error('Erro ao carregar unidades operacionais', err);
        }
      });
  }

  // ==========================================
  // 📦 LISTAGEM DE ORDENS
  // ==========================================

  getServiceOrders(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // ==========================================
  // 📝 CRIAR OS
  // ==========================================

  createOS(orderData: CreateOsPayload): Observable<any> {

    // CORREÇÃO CRÍTICA:
    // Injeta automaticamente o UUID da unidade operacional
    const payload: CreateOsPayload = {
      ...orderData,

      items: orderData.items.map(item => ({
        ...item,

        operationalUnitId:
          item.operationalUnitId ||
          this.selectedOperationalUnitId(),
      })),
    };

    return this.http.post(this.apiUrl, payload);
  }

  // ==========================================
  // ✏️ ATUALIZAR OS
  // ==========================================

  updateOS(
    orderId: string,
    orderData: Partial<CreateOsPayload>
  ): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/${orderId}`,
      orderData
    );
  }

  // ==========================================
  // 🚚 SUBMETER OS
  // ==========================================

  submitOS(orderId: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${orderId}/submit`,
      {}
    );
  }

  // ==========================================
  // ✅ FINALIZAR OS
  // ==========================================

  finalizeOS(orderId: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${orderId}/ready`,
      {}
    );
  }
}