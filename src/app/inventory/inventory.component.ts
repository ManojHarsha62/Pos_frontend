import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Inventory } from '../interfaces/inventory.interface';
import { InventoryForm } from '../interfaces/inventory-form.interface';
import { InventoryService } from '../services/inventory.service';
import { ProductService } from '../services/product.service';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss']
})
export class InventoryComponent implements OnInit {
  protected readonly Array = Array;

  inventory: Inventory[] = [];
  loading = true;
  error: string | null = null;
  productMap = new Map<number, string>();

  constructor(
    private inventoryService: InventoryService,
    private productService: ProductService
  ) {}

  ngOnInit() {
    this.fetchInitialData();
  }

  private fetchInitialData() {
    this.loading = true;
    this.error = null;

    forkJoin({
      inventory: this.inventoryService.getInventory(),
      products: this.productService.getProducts()
    }).subscribe({
      next: (data) => {
        // Create product map
        data.products.forEach(product => {
          this.productMap.set(product.id, product.name);
        });

        // Set inventory
        this.inventory = data.inventory.map(item => ({
          ...item
        }));
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching data:', error);
        this.error = 'Failed to load data. Please try again later.';
        this.loading = false;
      }
    });
  }

  getProductName(productId: number): string {
    return this.productMap.get(productId) || `Unknown Product (${productId})`;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      if (file.name.endsWith('.tsv')) {
        this.processTsvFile(file);
      } else {
        this.error = 'Please upload a .tsv file';
      }
    }
  }

  private processTsvFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const stockUpdates: { id: number, form: InventoryForm }[] = [];
      
      console.log('Current inventory:', this.inventory); // Debug log
      
      // Skip header row and process each line
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          const [product_id, stock] = line.split('\t');
          const numericProductId = parseInt(product_id, 10); // Explicitly use base 10
          const numericStock = parseInt(stock, 10); // Explicitly use base 10

          console.log('Processing line:', { 
            product_id, 
            numericProductId, 
            stock, 
            numericStock,
            isProductIdNumber: !isNaN(numericProductId),
            isStockNumber: !isNaN(numericStock)
          }); // Debug log

          // Find existing inventory entry
          const existingEntry = this.inventory.find(inv => inv.product_id === numericProductId);
          
          console.log('Found existing entry:', existingEntry); // Debug log

          if (existingEntry) {
            const update = {
              id: existingEntry.id,
              form: {
                product_id: numericProductId,
                stock: numericStock
              }
            };
            console.log('Adding update:', update); // Debug log
            stockUpdates.push(update);
          } else {
            console.warn(`Product ID ${numericProductId} not found in inventory`);
          }
        }
      }

      console.log('Final stock updates:', stockUpdates); // Debug log

      if (stockUpdates.length > 0) {
        this.inventoryService.updateBulkInventory(stockUpdates)
          .subscribe({
            next: (response) => {
              console.log('Update response:', response); // Debug log
              this.fetchInitialData();
              this.error = null;
            },
            error: (error) => {
              console.error('Error updating stock levels:', error);
              this.error = 'Failed to update stock levels from TSV file';
            }
          });
      }
    };
    reader.readAsText(file);
  }
} 