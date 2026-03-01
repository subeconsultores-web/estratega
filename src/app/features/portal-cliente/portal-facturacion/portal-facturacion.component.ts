import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { LUCIDE_ICONS, LucideIconProvider, LucideAngularModule, Receipt } from 'lucide-angular';
import { Observable, combineLatest, switchMap, of } from 'rxjs';
import { FacturaService } from '../../../core/services/factura.service';
import { AuthService } from '../../../core/services/auth.service';
import { Factura } from '../../../core/models/factura.model';
import { LoadingSkeleton } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { DataTableComponent, ColumnDef } from '../../../shared/components/data-table/data-table.component';

@Component({
    selector: 'app-portal-facturacion',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, LoadingSkeleton, DataTableComponent],
    providers: [
        { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Receipt }) }, DatePipe],
    template: `
        <div class="space-y-6">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-txt-primary tracking-tight">Facturación y Pagos</h1>
                    <p class="text-txt-secondary mt-1 text-sm">Historial de tus comprobantes y enlaces de pago online.</p>
                </div>
            </div>

            <ng-container *ngIf="facturas$ | async as facturas; else loading">
                <app-data-table *ngIf="facturas.length > 0; else emptyState" [data]="facturas" [columns]="columns" (actionClick)="onActionClick($event)">
                </app-data-table>

                <ng-template #emptyState>
                     <div class="bg-surface rounded-xl shadow-elevation-1 border border-border p-12 text-center">
                        <div class="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <lucide-icon name="receipt" class="w-8 h-8"></lucide-icon>
                        </div>
                        <h2 class="text-lg font-bold text-txt-primary mb-2">No tienes facturas emitidas</h2>
                        <p class="text-txt-secondary max-w-md mx-auto">Mantén al día tus servicios contactando a tu ejecutivo.</p>
                    </div>
                </ng-template>
            </ng-container>

            <ng-template #loading>
                <app-loading-skeleton></app-loading-skeleton>
            </ng-template>
        </div>
    `
})
export class PortalFacturacionComponent implements OnInit {
    private facturasService = inject(FacturaService);
    private authService = inject(AuthService);

    facturas$!: Observable<Factura[]>;

    columns: ColumnDef[] = [
        { key: 'id', label: 'No. Factura' },
        { key: 'total', label: 'Importe Total', type: 'currency' },
        { key: 'estado', label: 'Estado', type: 'badge' },
        { key: 'fechaVencimiento', label: 'Vencimiento', type: 'date' }
    ];

    ngOnInit() {
        // Filtrar facturas por tenantId + clienteId del usuario autenticado
        this.facturas$ = combineLatest([
            this.authService.tenantId$,
            this.authService.clienteId$
        ]).pipe(
            switchMap(([tenantId, clienteId]) => {
                if (!tenantId || !clienteId) return of([] as Factura[]);
                return this.facturasService.getFacturasCliente(tenantId, clienteId);
            })
        );
    }

    async onActionClick(event: { item: Factura | any, action: string }) {
        if (event.action === 'view') {
            if (event.item.estado === 'emitida' || event.item.estado === 'vencida') {
                const url = await this.facturasService.getCheckoutUrl(event.item.id!);
                if (url) {
                    window.location.href = url;
                } else {
                    alert('Sesión de pago aún no generada por Caja.');
                }
            } else {
                alert('La factura ya está pagada y/o anulada.');
            }
        }
    }
}
