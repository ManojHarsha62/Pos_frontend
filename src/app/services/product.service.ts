import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../interfaces/product.interface';
import { ProductForm } from '../interfaces/product-form.interface';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private baseUrl = 'http://localhost:9000/api/api/admin/product';

  constructor(private http: HttpClient) {}

  getProducts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/`);
  }

  addProduct(product: ProductForm): Observable<any> {
    return this.http.post(`${this.baseUrl}/add`, product);
  }

  updateProduct(id: number, product: ProductForm): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, product);
  }

  updateStock(product_id: number, stock: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/update_stock/${product_id}`, { stock });
  }

  addBulkProducts(products: ProductForm[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/add`, products);
  }
} 