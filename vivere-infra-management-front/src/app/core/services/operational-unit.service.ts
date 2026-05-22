import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OperationalUnitService {
  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:8081/operational-units';

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}