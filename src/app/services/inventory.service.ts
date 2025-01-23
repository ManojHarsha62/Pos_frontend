import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { Inventory } from '../interfaces/inventory.interface';
import { InventoryForm } from '../interfaces/inventory-form.interface';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private baseUrl = 'http://localhost:9000/api/api/admin/inventory';

  constructor(private http: HttpClient) {}

  getInventory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/`);
  }

  updateInventory(id: number, inventory: InventoryForm): Observable<any> {
    console.log(`Updating inventory ID ${id}:`, inventory);
    return this.http.put(`${this.baseUrl}/${id}`, inventory);
  }

  updateBulkInventory(updates: { id: number, form: InventoryForm }[]): Observable<any> {
    console.log('Starting bulk inventory update with:', updates);
    return forkJoin(
      updates.map(update => {
        console.log(`Processing update for ID ${update.form.product_id}:`, update.form);
        return this.updateInventory(update.form.product_id, update.form);
      })
    );
  }

  addBulkInventory(inventories: InventoryForm[]): Observable<any> {
    console.log('Creating new inventory entries:', inventories);
    return this.http.post(`${this.baseUrl}/add`, inventories);
  }
}