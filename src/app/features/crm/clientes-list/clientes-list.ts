import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { CrmService } from '../../../core/services/crm.service';
import { Cliente } from '../../../core/models/crm.model';
import { LoadingSkeleton } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { EmptyState } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-clientes-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule, LoadingSkeleton, EmptyState],
  templateUrl: './clientes-list.html',
  styleUrl: './clientes-list.scss',
})
export class ClientesList implements OnInit {
  private crmService = inject(CrmService);

  clientes: Cliente[] = [];
  filteredClientes: Cliente[] = [];
  isLoading = true;
  searchTerm = '';
  filtroEstado = 'todos';

  ngOnInit() {
    this.cargarClientes();
  }

  cargarClientes() {
    this.crmService.getClientes().subscribe({
      next: (data) => {
        this.clientes = data;
        this.filtrarClientes();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error cargando clientes:', err);
        this.isLoading = false;
      }
    });
  }

  filtrarClientes() {
    this.filteredClientes = this.clientes.filter(cliente => {
      const matchSearch = cliente.nombreEmpresa.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (cliente.rut && cliente.rut.includes(this.searchTerm));
      const matchEstado = this.filtroEstado === 'todos' || cliente.estado === this.filtroEstado;
      return matchSearch && matchEstado;
    });
  }

  getBadgeColor(estado: string): string {
    switch (estado) {
      case 'lead': return 'bg-blue-100 text-blue-800';
      case 'prospecto': return 'bg-yellow-100 text-yellow-800';
      case 'activo': return 'bg-emerald-100 text-emerald-800';
      case 'inactivo': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}
