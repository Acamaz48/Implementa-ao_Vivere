import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface VivereEvent {
  id?: string;
  name: string;
  startDate: string;
  endDate?: string;
  latitude: number;
  longitude: number;
  local?: string;
  status: string;
  description: string;
  address?: any; // Mantido para o mapeamento seguro
  serviceOrderId?: string;
  supplier?: string;
  observation?: string;
  missingItems?: any[];
  reviewedBy?: any;
  items?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private http = inject(HttpClient);
  // CORREÇÃO: O serviço de eventos agora atua como uma "Fachada" consultando o módulo unificado
  private apiUrl = 'http://localhost:8081/service-orders'; 

  getEvents(): Observable<VivereEvent[]> {
  return this.http.get<any[]>(this.apiUrl).pipe(
    map(orders => orders.map(os => ({
      ...os.event,

      osId: os.id,
      status: os.status,
      supplier: os.supplier,
      observation: os.observation,
      items: os.items,

      description: os.supplier || 'Sem fornecedor definido'
    })))
  );
}

  // Como a criação agora é centralizada na OS, estes métodos disparam avisos se usados incorretamente
  createEvent(event: any): Observable<any> {
    console.warn("DEPRECATED: Use o ServiceOrderService para criar eventos e OS simultaneamente.");
    return this.http.post(this.apiUrl, event);
  }

  updateEvent(id: string, event: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, event);
  }

  reviewOrder(id: string, dto: any) {
  return this.http.post(`${this.apiUrl}/${id}/review`,dto);
}

  deleteEvent(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
  aprovarProducao(id: string) {
    return this.http.post(`${this.apiUrl}/${id}/ready`,{});
  }
  resubmitOrder(id: string) {
    return this.http.post(`${this.apiUrl}/${id}/resubmit`,{});
  }
}