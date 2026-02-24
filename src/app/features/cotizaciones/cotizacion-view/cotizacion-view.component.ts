import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location, CurrencyPipe, SlicePipe } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { LUCIDE_ICONS, LucideIconProvider,  LucideAngularModule, ArrowLeft, CalendarClock, Edit, History, Layers, Send, User  } from 'lucide-angular';
import { ToastrService } from 'ngx-toastr';
import { CotizacionService } from '../../../core/services/cotizacion.service';
import { CrmService } from '../../../core/services/crm.service';

// Modelos
import { Cotizacion } from '../../../core/models/cotizacion.model';
import { Cliente } from '../../../core/models/crm.model';
import { Timestamp } from '@angular/fire/firestore';

@Component({
    selector: 'app-cotizacion-view',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule, CurrencyPipe],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ ArrowLeft, CalendarClock, Edit, History, Layers, Send, User }) }
  ],
    templateUrl: './cotizacion-view.component.html'
})
export class CotizacionViewComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private location = inject(Location);
    private cotizacionService = inject(CotizacionService);
    private crmService = inject(CrmService);
    private toastr = inject(ToastrService);

    itemId = this.route.snapshot.paramMap.get('id');
    cotizacion: Cotizacion | null = null;
    clienteAso: Cliente | null = null;

    isLoading = true;
    isStatusChanging = false;

    ngOnInit() {
        this.cargarDatosContext();
    }

    getExpirationDateStr(): string {
        if (!this.cotizacion || !this.cotizacion.fechaExpiracion) return '';
        if (this.cotizacion.fechaExpiracion instanceof Timestamp) {
            return this.cotizacion.fechaExpiracion.toDate().toLocaleDateString();
        }
        return new Date(this.cotizacion.fechaExpiracion).toLocaleDateString();
    }

    getTraceDateStr(fecha: any): string {
        if (!fecha) return 'Desconocida';
        if (fecha instanceof Timestamp) return fecha.toDate().toLocaleDateString();
        if (fecha instanceof Date) return fecha.toLocaleDateString();
        return new Date(fecha).toLocaleDateString();
    }

    getEmisionDateStr(): string {
        if (!this.cotizacion || !this.cotizacion.fechaEmision) return '';
        if (this.cotizacion.fechaEmision instanceof Timestamp) {
            return this.cotizacion.fechaEmision.toDate().toLocaleDateString();
        }
        return new Date(this.cotizacion.fechaEmision).toLocaleDateString();
    }

    async cargarDatosContext() {
        if (!this.itemId) {
            this.toastr.error('ID de Cotización inválido');
            this.router.navigate(['/cotizaciones']);
            return;
        }

        this.cotizacionService.getCotizacion(this.itemId).subscribe(coti => {
            if (!coti) {
                this.isLoading = false;
                this.toastr.error('Cotización extraviada');
                this.router.navigate(['/cotizaciones']);
                return;
            }

            this.cotizacion = coti;

            // Fetch data from foreign relationship CRM
            this.crmService.getCliente(coti.clienteId).subscribe(cli => {
                if (cli) this.clienteAso = cli;
                this.isLoading = false;
            });
        });
    }

    async setEstado(nuevo: 'Enviada' | 'Revision_Solicitada' | 'Aceptada' | 'Rechazada') {
        if (!this.cotizacion || !this.cotizacion.id) return;
        try {
            this.isStatusChanging = true;
            // Se enviaría un comentario predeterminado según el botón apretado en UI
            await this.cotizacionService.changeStatus(this.cotizacion.id, nuevo, this.cotizacion.historialEstados, `Cambio manual a estado: ${nuevo}`);
            this.toastr.success(`Cotización marcada como ${nuevo}`);
            // Subscripcion reactiva de Firebase actualiza local automáticamente
        } catch (e) {
            console.error(e);
            this.toastr.error('Problemas guardando estado en base de datos');
        } finally {
            this.isStatusChanging = false;
        }
    }

    goBack() {
        this.location.back();
    }

}
