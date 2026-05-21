// vivere-infra-management-front\src\app\core\services\material.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  Material, 
  Structure, 
  CreateMaterialPayload, 
  CreateStructurePayload,
  RegisterStockPayload
} from '../../shared/models/material.model';
import { ApiMessageResponse } from '../../shared/models/user.model';

@Injectable({ providedIn: 'root' })
export class MaterialService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8081/materials'; 

  // ==========================================
  // --- MATERIAIS BASE ---
  // ==========================================
  
  getMaterials(): Observable<Material[]> { 
    return this.http.get<Material[]>(this.apiUrl); 
  }
  
  createMaterial(data: CreateMaterialPayload): Observable<Material> {
    return this.http.post<Material>(this.apiUrl, data);
  }
  
  deleteMaterial(id: string): Observable<ApiMessageResponse> {
    return this.http.delete<ApiMessageResponse>(`${this.apiUrl}/${id}`);
  }

  // NOVO: Consome a rota transacional de entrada de stock do backend
  registerStock(materialId: string, payload: RegisterStockPayload): Observable<Material> {
    return this.http.post<Material>(`${this.apiUrl}/${materialId}/stock`, payload);
  }

  // ==========================================
  // --- ESTRUTURAS (GABARITOS) ---
  // ==========================================
  
  getStructures(): Observable<Structure[]> { 
    return this.http.get<Structure[]>(`${this.apiUrl}/structure`); 
  }
  
  createStructure(data: CreateStructurePayload): Observable<Structure> {
    return this.http.post<Structure>(`${this.apiUrl}/structure`, data);
  }
  
  deleteStructure(id: string): Observable<ApiMessageResponse> {
    return this.http.delete<ApiMessageResponse>(`${this.apiUrl}/structure/${id}`);
  }
}