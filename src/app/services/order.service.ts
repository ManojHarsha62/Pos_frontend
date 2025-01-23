import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order, OrderDetail } from '../interfaces/order.interface';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private baseUrl = 'http://localhost:9000/api/api/admin';

  constructor(private http: HttpClient) {}

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.baseUrl}/orders/`);
  }

  getOrderDetails(orderId: number): Observable<OrderDetail[]> {
    return this.http.get<OrderDetail[]>(`${this.baseUrl}/orders/order-items/${orderId}`);
  }

  createOrder(order: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/orders/add`, order);
  }

  createOrderItem(orderItem: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/order-items/add`, orderItem);
  }
} 
