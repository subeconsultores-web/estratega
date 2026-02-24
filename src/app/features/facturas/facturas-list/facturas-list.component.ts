import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LUCIDE_ICONS, LucideIconProvider,  LucideAngularModule, Loader2, Plus, Receipt  } from 'lucide-angular';
import { ToastrService } from 'ngx-toastr';

import { FacturaService } from '../../../core/services/factura.service';
import { AuthService } from '../../../core/services/auth.service';
import { Factura } from '../../../core/models/factura.model';
import { DataTableComponent, ColumnDef } from '../../../shared/components/data-table/data-table.component';

@Component({
    selector: 'app-facturas-list',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule, DataTableComponent],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Loader2, Plus, Receipt }) }
  ],
    templateUrl: './facturas-list.component.html'
})
export class FacturasListComponent implements OnInit {
    private facturaService = inject(FacturaService);
    private authService = inject(AuthService);
    private router = inject(Router);
    private toastr = inject(ToastrService);
    private cdr = inject(ChangeDetectorRef);

    facturas: Factura[] = [];
    isLoading = true;

    columns: ColumnDef[] = [
        { key: 'codigoFormateado', label: 'ID', sortable: true },
        { key: 'fechaEmision', label: 'Emisión', type: 'date', sortable: true },
        { key: 'fechaVencimiento', label: 'Vencimiento', type: 'date', sortable: true },
        { key: 'total', label: 'Total', type: 'currency', sortable: true },
        { key: 'estado', label: 'Estado', type: 'badge', sortable: true },
        { key: 'actions', label: 'Acciones', type: 'action' }
    ];

    ngOnInit(): void {
        this.loadFacturas();
    }

    async loadFacturas() {
        this.isLoading = true;
        try {
            const tenantId = await this.authService.getTenantId();
            if (!tenantId) {
                this.toastr.error('No se pudo identificar la compañía (tenant)');
                this.isLoading = false;
                this.cdr.detectChanges();
                return;
            }

            this.facturaService.getFacturas(tenantId).subscribe({
                next: (data) => {
                    this.facturas = data.map(f => ({
                        ...f,
                        fechaEmision: (f.fechaEmision as any)?.toDate ? (f.fechaEmision as any).toDate() : new Date(f.fechaEmision),
                        fechaVencimiento: (f.fechaVencimiento as any)?.toDate ? (f.fechaVencimiento as any).toDate() : new Date(f.fechaVencimiento)
                    }));
                    this.isLoading = false;
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    console.error('[Facturas] Error cargando facturas:', err);
                    this.toastr.error('Error cargando las facturas');
                    this.facturas = [];
                    this.isLoading = false;
                    this.cdr.detectChanges();
                }
            });
        } catch (e) {
            console.error('[Facturas] Exception in loadFacturas:', e);
            this.facturas = [];
            this.isLoading = false;
            this.cdr.detectChanges();
        }
    }

    onAction(event: { action: string, item: any }) {
        if (event.action === 'edit' || event.action === 'view') {
            const routePath = event.action === 'view' ? `/facturas/${event.item.id}/view` : `/facturas/${event.item.id}`;
            this.router.navigate([routePath]);
        } else if (event.action === 'delete') {
            if (confirm('¿Seguro de que deseas anular esta factura?')) {
                this.facturaService.cambiarEstado(event.item.id, 'anulada').then(() => {
                    this.toastr.info('Factura anulada exitosamente');
                }).catch(e => {
                    console.error(e);
                    this.toastr.error('Hubo un error anulando la factura');
                });
            }
        }
    }
}
