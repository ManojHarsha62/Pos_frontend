import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Order, OrderDetail } from '../interfaces/order.interface';
import { OrderService } from '../services/order.service';
import { ClientService } from '../services/client.service';
import { ProductService } from '../services/product.service';

interface OrderItem {
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
}

interface NewOrder {
  user_id: number;
  items: OrderItem[];
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit {
  protected readonly Array = Array;
  
  products: any[] = [];
  orders: Order[] = [];
  loading = true;
  error: string | null = null;
  clientMap = new Map<number, string>();
  productMap = new Map<number, string>();
  costMap = new Map<number, number>();
  barcodeMap = new Map<number, string>();
  showOrderModal = false;
  orderItems: { product_id: number; quantity: number; price: number}[] = [];
  currentItem = { product_id: 0, quantity: 0 };
  expandedOrders: { [key: number]: boolean } = {};
  orderDetailsMap: { [key: number]: OrderDetail[] } = {};

  constructor(
    private orderService: OrderService,
    private clientService: ClientService,
    private productService: ProductService
  ) {}

  ngOnInit() {
    this.fetchInitialData();
  }

  private fetchInitialData() {
    this.loading = true;
    this.error = null;

    forkJoin({
      orders: this.orderService.getOrders(),
      clients: this.clientService.getClients(),
      products: this.productService.getProducts()
    }).subscribe({
      next: (data) => {
        this.orders = data.orders;
        this.products = data.products;
        
        // Create client map
        data.clients.forEach(client => {
          this.clientMap.set(client.id, client.name);
        });

        // Create product maps with product names and barcodes
        data.products.forEach(product => {
          console.log(product.id , product.name);
          this.productMap.set(product.id, product.name);
          this.costMap.set(product.id, product.cost);
          this.barcodeMap.set(product.id, product.barcode);
          console.log(this.getProductName(product.id));
        });

        console.log('Final productMap:', Array.from(this.productMap.entries()));

        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching data:', error);
        this.error = 'Failed to load orders. Please try again later.';
        this.loading = false;
      }
    });
  }

  getClientName(clientId: number): string {
    return this.clientMap.get(clientId) || `Unknown Client (${clientId})`;
  }

  getProductName(productId: number): string {
    return this.productMap.get(productId) || `Unknown Product (${productId})`;
  }

  getProductCost(productId: number): number {
    return this.costMap.get(productId) || 0;
  }

  getProductBarcode(productId: number): string {
    return this.barcodeMap.get(productId) || 'N/A';
  }

  toggleOrderDetails(order: Order) {
    if (this.expandedOrders[order.id]) {
      // If already expanded, just collapse
      this.expandedOrders[order.id] = false;
    } else {
      // If not expanded, fetch details and expand
      this.orderService.getOrderDetails(order.id).subscribe({
        next: (details) => {
          this.orderDetailsMap[order.id] = details;
          this.expandedOrders[order.id] = true;
        },
        error: (error) => {
          console.error('Error fetching order details:', error);
          this.error = 'Failed to load order details';
        }
      });
    }
  }

  addNewOrder() {
    this.showOrderModal = true;
    this.orderItems = [];
    this.currentItem = { product_id: 0, quantity: 0 };
  }

  addItem() {
    if (this.currentItem.product_id && this.currentItem.quantity > 0) {
      const productName = this.productMap.get(Number(this.currentItem.product_id));
      const product = this.products.find(p => p.id === Number(this.currentItem.product_id));
      
      if (productName && product) {
        const total = this.currentItem.quantity * product.price;
        this.orderItems.push({
          product_id: this.currentItem.product_id,
          quantity: this.currentItem.quantity,
          price: product.price
        });
        this.currentItem = { product_id: 0, quantity: 0 };
      }
    }
  }

  removeItem(index: number) {
    this.orderItems.splice(index, 1);
  }


  submitOrder() {
    if (this.orderItems.length === 0) {
      this.error = 'Please add at least one item';
      return;
    }

    const total_price = this.orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const order = {
      user_id: 1,
      total_price: total_price,
      orderItems: this.orderItems
    };

    this.orderService.createOrder(order).subscribe({
      next: () => {
        console.log("into next");
        console.log(order.orderItems);
        console.log(order.total_price);
        this.showOrderModal = false;
        this.orderItems = [];
        this.fetchInitialData();
      },
      error: (error) => {
        console.log(order.orderItems);
        console.log(order.total_price);
        console.error('Error creating order:', error);
        this.error = 'Failed to create order';
      }
    });
  }

  cancelOrder() {
    this.showOrderModal = false;
    this.orderItems = [];
  }
}
