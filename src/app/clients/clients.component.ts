import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Client } from '../interfaces/client.interface';
import { ClientForm } from '../interfaces/client-form.interface';
import { ClientService } from '../services/client.service';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.scss']
})
export class ClientsComponent implements OnInit {
  clients: Client[] = [];
  loading = true;
  error: string | null = null;
  editingClient: Client | null = null;
  showAddForm = false;
  newClient: ClientForm = {
    name: '',
    email: '',
    contact_no: ''
  };

  constructor(private clientService: ClientService) {}

  ngOnInit() {
    this.fetchClients();
  }

  private fetchClients() {
    this.loading = true;
    this.error = null;

    this.clientService.getClients()
      .subscribe({
        next: (response) => {
          this.clients = response.map(client => ({
            ...client
          }));
          this.loading = false;
          console.log(this.clients);
        },
        error: (error) => {
          console.error('Error fetching clients:', error);
          this.error = 'Failed to load clients. Please try again later.';
          this.loading = false;
        }
      });
  }

  startEdit(client: Client) {
    this.editingClient = { ...client };
  }

  cancelEdit() {
    this.editingClient = null;
  }

  saveEdit() {
    if (!this.editingClient) return;

    const form: ClientForm = {
      name: this.editingClient.name,
      email: this.editingClient.email,
      contact_no: this.editingClient.contact_no
    };

    this.clientService.updateClient(this.editingClient.id, form)
      .subscribe({
        next: () => {
          this.fetchClients();
          this.editingClient = null;
        },
        error: (error) => {
          console.error('Error details:', error.error);
          this.error = `Failed to update client: ${error.error?.message || error.message}`;
        }
      });
  }

  addNewClient() {
    this.showAddForm = true;
    this.newClient = {
      name: '',
      email: '',
      contact_no: ''
    };
  }

  cancelAdd() {
    this.showAddForm = false;
  }

  submitNewClient() {
    if (!this.newClient.name || !this.newClient.email || !this.newClient.contact_no) {
      this.error = 'Please fill in all fields';
      return;
    }

    this.clientService.addClient(this.newClient)
      .subscribe({
        next: () => {
          this.showAddForm = false;
          this.fetchClients();
        },
        error: (error) => {
          console.error('Error details:', error.error);
          this.error = `Failed to add client: ${error.error?.message || error.message}`;
        }
      });
  }
}
