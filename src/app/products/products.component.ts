import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Product } from '../interfaces/product.interface';
import { ProductForm } from '../interfaces/product-form.interface';
import { ProductService } from '../services/product.service';
import { ClientService } from '../services/client.service';
import { InventoryService } from '../services/inventory.service';
import { InventoryForm } from '../interfaces/inventory-form.interface';

interface DuplicateProduct {
  name: string;
  client_id: number;
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {
  protected readonly Array = Array;

  products: Product[] = [];
  loading = true;
  error: string | null = null;
  editingProduct: Product | null = null;
  duplicateProducts: DuplicateProduct[] = [];
  showDuplicateModal = false;
  clientMap = new Map<number, string>();
  inventory: any[] = [];
  showTsvModal = false;

  constructor(
    private productService: ProductService,
    private clientService: ClientService,
    private inventoryService: InventoryService
  ) {}

  ngOnInit() {
    this.fetchInitialData();
  }

  private fetchInitialData() {
    this.loading = true;
    this.error = null;

    forkJoin({
      products: this.productService.getProducts(),
      clients: this.clientService.getClients(),
      inventory: this.inventoryService.getInventory()
    }).subscribe({
      next: (data) => {
        data.clients.forEach(client => {
          this.clientMap.set(client.id, client.name);
        });

        this.products = data.products.map(product => ({
          ...product
        }));
        
        this.inventory = data.inventory;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching data:', error);
        this.error = 'Failed to load data. Please try again later.';
        this.loading = false;
      }
    });
  }

  getClientName(clientId: number): string {
    return this.clientMap.get(clientId) || `Unknown Client (${clientId})`;
  }

  startEdit(product: Product) {
    this.editingProduct = { ...product };
  }

  cancelEdit() {
    this.editingProduct = null;
  }

  saveEdit() {
    if (!this.editingProduct) return;

    const form: ProductForm = {
      name: this.editingProduct.name,
      client_id: this.editingProduct.client_id,
      price: this.editingProduct.price,
      barcode: this.editingProduct.barcode
    };

    this.productService.updateProduct(this.editingProduct.id, form)
      .subscribe({
        next: () => {
          this.fetchInitialData();
          this.editingProduct = null;
        },
        error: (error) => {
          console.error('Error details:', error.error);
          this.error = `Failed to update product: ${error.error?.message || error.message}`;
        }
      });
  }

  processTsvFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const products: ProductForm[] = [];
      this.duplicateProducts = [];
      
      // Skip header row and process each line
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          const [name, client_id, price, barcode] = line.split('\t');
          const numericClientId = parseInt(client_id);
          
          // Check for duplicates by name AND client_id
          const isDuplicate = this.products.some(
            existingProduct => 
              existingProduct.name.toLowerCase() === name.toLowerCase() && 
              existingProduct.client_id === numericClientId
          );

          if (isDuplicate) {
            this.duplicateProducts.push({
              name: name,
              client_id: numericClientId
            });
          } else {
            products.push({
              name: name,
              client_id: numericClientId,
              price: parseFloat(price),
              barcode: barcode
            });
          }
        }
      }

      if (this.duplicateProducts.length > 0) {
        const duplicateMessages = this.duplicateProducts.map(dp => 
          `Product "${dp.name}" for Client ID ${dp.client_id}`
        );
        this.error = `The following products are already in the list:\n${duplicateMessages.join('\n')}`;
        this.showDuplicateModal = true;
        return;
      }

      // Only proceed if there are new products to add
      if (products.length > 0) {
        this.productService.addBulkProducts(products)
          .subscribe({
            next: (response) => {
              this.createInventoryForNewProducts(products);
              this.fetchInitialData();
              this.error = null;
            },
            error: (error) => {
              console.error('Error adding products:', error);
              this.error = 'Failed to add products from TSV file';
            }
          });
      }
    };
    reader.readAsText(file);
  }

  showImportModal() {
    this.showTsvModal = true;
  }

  closeImportModal() {
    this.showTsvModal = false;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      if (file.name.endsWith('.tsv')) {
        this.processTsvFile(file);
        this.closeImportModal();
      } else {
        this.error = 'Please upload a .tsv file';
      }
    }
  }

  closeDuplicateModal() {
    this.showDuplicateModal = false;
    this.error = null;
  }

  // Switch Maps and Merge maps
  private createInventoryForNewProducts(newProducts: ProductForm[]) {
    this.productService.getProducts().subscribe({
      next: (latestProducts) => {
        // Filter latest products to only include those from the TSV file
        const tsvProductNames = newProducts.map(p => p.name.toLowerCase());
        const tsvClientIds = newProducts.map(p => p.client_id);
        
        const newProductIds = latestProducts
          .filter(p => 
            tsvProductNames.includes(p.name.toLowerCase()) && 
            tsvClientIds.includes(p.client_id)
          )
          .map(p => p.id);

        if (newProductIds.length > 0) {
          // Create new inventory entries with stock 0
          const inventoryEntries = newProductIds.map(id => ({
            id: 0, // This will be ignored for new entries
            form: {
              product_id: id,
              stock: 0
            }
          }));

          // Use POST for new entries
          this.inventoryService.addBulkInventory(inventoryEntries.map(entry => entry.form))
            .subscribe({
              next: () => {
                console.log('Inventory entries created for new TSV products');
                this.fetchInitialData();
              },
              error: (error) => {
                console.error('Error creating inventory entries:', error);
              }
            });
        }
      }
    });
  }
}
