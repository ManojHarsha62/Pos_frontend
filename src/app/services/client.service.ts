import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Client } from '../interfaces/client.interface';
import { ClientForm } from '../interfaces/client-form.interface';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private baseUrl = 'http://localhost:9000/api/api/admin/client';

  constructor(private http: HttpClient) {}

  getClients(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/`);
  }

  addClient(client: ClientForm): Observable<any> {
    return this.http.post(`${this.baseUrl}/add`, client);
  }

  updateClient(id: number, client: ClientForm): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, client);
  }
} 