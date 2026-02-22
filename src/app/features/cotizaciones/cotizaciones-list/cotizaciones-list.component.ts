import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { CotizacionService } from '../../../core/services/cotizacion.service';
import { Cotizacion } from '../../../core/models/cotizacion.model';
import { DataTableComponent, ColumnDef } from '../../../shared/components/data-table/data-table.component';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-cotizaciones-list',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule, DataTableComponent],
    templateUrl: './cotizaciones-list.component.html'
})
export class CotizacionesListComponent implements OnInit {
    private cotizacionService = inject(CotizacionService);
    private router = inject(Router);
    private toastr = inject(ToastrService);

    items: Cotizacion[] = [];
    isLoading = true;

    columns: ColumnDef[] = [
        { key: 'correlativo', label: 'Folio' },
        { key: 'clienteNombre', label: 'Cliente' }, // Requiere un join visual o guardado estático
        { key: 'fechaEmision', label: 'Fecha', type: 'date' },
        { key: 'totalFinal', label: 'Monto Total', type: 'currency' },
        { key: 'estadoActual', label: 'Estado', type: 'badge' },
        { key: 'actions', label: '', type: 'action' }
    ];

    ngOnInit() {
        this.loadList();
    }

    loadList() {
        this.isLoading = true;
        this.cotizacionService.getCotizaciones().subscribe({
            next: (data) => {
                // Mapeo temporal visual. Realmente el nombre del cliente debería venir cruzado o guardado como foto en la coti
                this.items = data.map((c: Cotizacion) => ({
                    ...c,
                    clienteNombre: 'Cliente ID (Pendiente Resolve)' // TODO: Resolver nombre vía ClientService
                }));
                this.isLoading = false;
            },
            error: (e: any) => {
                this.toastr.error('Error cargando cotizaciones');
                console.error(e);
                this.isLoading = false;
            }
        });
    }

    onAction(event: { item: any, action: string } | any) {
        if (event.action === 'edit' || event.action === 'view') {
            this.router.navigate(['/cotizaciones', event.item.id]);
        } else if (event.action === 'delete') {
            if (confirm(`¿Eliminar la cotización ${event.item.correlativo}?`)) {
                this.cotizacionService.deleteCotizacion(event.item.id).then(() => {
                    this.toastr.success('Cotización eliminada');
                });
            }
        }
    }

}
