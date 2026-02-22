import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CotizacionService } from '../../../core/services/cotizacion.service';
import { CrmService } from '../../../core/services/crm.service';
import { Cotizacion } from '../../../core/models/cotizacion.model';
import { Cliente } from '../../../core/models/crm.model';
import { LucideAngularModule } from 'lucide-angular';
import { ToastrService } from 'ngx-toastr';
import { LoadingSkeleton } from '../../../shared/components/loading-skeleton/loading-skeleton.component';

@Component({
  selector: 'app-cotizacion-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, LoadingSkeleton],
  templateUrl: './cotizacion-detalle.html',
  styleUrl: './cotizacion-detalle.scss',
})
export class CotizacionDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private cotizacionService = inject(CotizacionService);
  private crmService = inject(CrmService);
  private toastr = inject(ToastrService);

  cotizacion: Cotizacion | null = null;
  cliente: Cliente | null = null;
  isLoading = true;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarDatos(id);
    } else {
      this.toastr.error('ID de cotización no válido');
    }
  }

  cargarDatos(id: string) {
    this.cotizacionService.getCotizacion(id).subscribe({
      next: (cotData) => {
        if (cotData) {
          this.cotizacion = cotData;
          // Obtener datos del cliente asociado
          this.crmService.getCliente(cotData.clienteId).subscribe({
            next: (cliData) => {
              this.cliente = cliData || null;
              this.isLoading = false;
            },
            error: () => this.isLoading = false
          });
        } else {
          this.toastr.error('Cotización no encontrada');
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error(error);
        this.toastr.error('Error al cargar la cotización');
        this.isLoading = false;
      }
    });
  }

  cambiarEstado(nuevoEstado: Cotizacion['estado']) {
    if (!this.cotizacion?.id) return;

    // Aquí idealmente se abre un modal de confirmación o de recepción de OC
    this.cotizacionService.updateCotizacion(this.cotizacion.id, { estado: nuevoEstado })
      .then(() => {
        this.toastr.success(`Estado cambiado a ${nuevoEstado}`);
        if (this.cotizacion) {
          this.cotizacion.estado = nuevoEstado;
        }
      })
      .catch(e => {
        console.error(e);
        this.toastr.error('Error al actualizar estado');
      });
  }

  generarPDF() {
    // Trigger para Backend Callable CF - O simulación FRONT (Frontend PDF maker)
    // El doc técnico sugiere Puppeteer en el Backend.
    this.toastr.info('La función de Render PDF con Puppeteer será abordada en la próxima iteración backend.');
  }

  // Utilidad visual
  getEstadoBadge(estado: string): string {
    const states: { [key: string]: string } = {
      'borrador': 'bg-gray-100 text-gray-800',
      'enviada': 'bg-blue-100 text-blue-800',
      'en_revision': 'bg-yellow-100 text-yellow-800',
      'aprobada': 'bg-green-100 text-green-800',
      'rechazada': 'bg-red-100 text-red-800',
      'expirada': 'bg-orange-100 text-orange-800'
    };
    return states[estado] || 'bg-gray-100 text-gray-800';
  }
}
