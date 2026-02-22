import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { CrmService } from '../../../core/services/crm.service';
import { Cliente, Actividad } from '../../../core/models/crm.model';
import { LoadingSkeleton } from '../../../shared/components/loading-skeleton/loading-skeleton.component';

@Component({
  selector: 'app-cliente-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, LoadingSkeleton],
  templateUrl: './cliente-detalle.html',
  styleUrl: './cliente-detalle.scss',
})
export class ClienteDetalle implements OnInit {
  private route = inject(ActivatedRoute);
  private crmService = inject(CrmService);

  clienteId: string | null = null;
  cliente: Cliente | null = null;
  actividades: Actividad[] = [];

  isLoading = true;
  isLoadingActividades = true;

  ngOnInit() {
    this.clienteId = this.route.snapshot.paramMap.get('id');
    if (this.clienteId) {
      this.cargarDatosCliente(this.clienteId);
      this.cargarActividades(this.clienteId);
    }
  }

  cargarDatosCliente(id: string) {
    this.crmService.getCliente(id).subscribe({
      next: (data) => {
        this.cliente = data || null;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar cliente', err);
        this.isLoading = false;
      }
    });
  }

  cargarActividades(id: string) {
    this.crmService.getActividadesCliente(id).subscribe({
      next: (data) => {
        this.actividades = data;
        this.isLoadingActividades = false;
      },
      error: (err) => {
        console.error('Error al cargar actividades', err);
        this.isLoadingActividades = false;
      }
    });
  }

  getBadgeColor(estado: string | undefined): string {
    switch (estado) {
      case 'lead': return 'bg-blue-100 text-blue-800';
      case 'prospecto': return 'bg-yellow-100 text-yellow-800';
      case 'activo': return 'bg-emerald-100 text-emerald-800';
      case 'inactivo': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  }
}
