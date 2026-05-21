import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OsItemPayload {
  materialId: string;
  operationalUnitId: string;
  quantity: number;
}

// CORREÇÃO DE ARQUITETURA: O Payload agora carrega dados do Evento E da OS na mesma requisição
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
  items: OsItemPayload[];
}

@Injectable({ providedIn: 'root' })
export class ServiceOrderService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8081/service-orders';

  // NOVO: Busca todas as OS com os Eventos embutidos
  getServiceOrders(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // 1. Cria OS + Evento Atómicamente (Nasce como DRAFT)
  createOS(orderData: CreateOsPayload): Observable<any> {
    return this.http.post(this.apiUrl, orderData);
  }

  // 2. Atualiza OS + Evento
  updateOS(orderId: string, orderData: Partial<CreateOsPayload>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${orderId}`, orderData);
  }

  // 3. Submeter OS (Máquina de Estados)
  submitOS(orderId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${orderId}/submit`, {});
  }

  // 4. Finalizar OS (READY)
  finalizeOS(orderId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${orderId}/ready`, {});
  }
}