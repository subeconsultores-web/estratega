import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { LUCIDE_ICONS, LucideIconProvider, LucideAngularModule, FileText } from 'lucide-angular';
import { Observable, combineLatest, switchMap, of } from 'rxjs';
import { CotizacionService } from '../../../core/services/cotizacion.service';
import { AuthService } from '../../../core/services/auth.service';
import { Cotizacion } from '../../../core/models/cotizacion.model';
import { LoadingSkeleton } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { DataTableComponent, ColumnDef } from '../../../shared/components/data-table/data-table.component';

@Component({
    selector: 'app-portal-cotizaciones',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, LoadingSkeleton, DataTableComponent],
    providers: [
        { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ FileText }) }, DatePipe],
    template: `
        <div class="space-y-6">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-txt-primary tracking-tight">Mis Cotizaciones</h1>
                    <p class="text-txt-secondary mt-1 text-sm">Consulta las propuestas comerciales recibidas y su estado.</p>
                </div>
            </div>

            <ng-container *ngIf="cotizaciones$ | async as cotizaciones; else loading">
                <app-data-table *ngIf="cotizaciones.length > 0; else emptyState" [data]="cotizaciones" [columns]="columns" (actionClick)="onActionClick($event)">
                </app-data-table>

                <ng-template #emptyState>
                     <div class="bg-surface rounded-xl shadow-elevation-1 border border-border p-12 text-center">
                        <div class="w-16 h-16 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <lucide-icon name="file-text" class="w-8 h-8"></lucide-icon>
                        </div>
                        <h2 class="text-lg font-bold text-txt-primary mb-2">Sin cotizaciones activas</h2>
                        <p class="text-txt-secondary max-w-md mx-auto">No tienes propuestas o presupuestos enviados por la Agencia.</p>
                    </div>
                </ng-template>
            </ng-container>

            <ng-template #loading>
                <app-loading-skeleton></app-loading-skeleton>
            </ng-template>
        </div>
    `
})
export class PortalCotizacionesComponent implements OnInit {
    private cotizacionService = inject(CotizacionService);
    private authService = inject(AuthService);

    cotizaciones$!: Observable<Cotizacion[]>;

    columns: ColumnDef[] = [
        { key: 'correlativo', label: 'Código' },
        { key: 'nombre', label: 'Propuesta' },
        { key: 'total', label: 'Costo Total', type: 'currency' },
        { key: 'estadoActual', label: 'Estado', type: 'badge' }
    ];

    ngOnInit() {
        // Filtrar cotizaciones por tenantId + clienteId del usuario autenticado
        this.cotizaciones$ = combineLatest([
            this.authService.tenantId$,
            this.authService.clienteId$
        ]).pipe(
            switchMap(([tenantId, clienteId]) => {
                if (!tenantId || !clienteId) return of([] as Cotizacion[]);
                return this.cotizacionService.getCotizacionesCliente(tenantId, clienteId);
            })
        );
    }

    onActionClick(event: { item: Cotizacion | any, action: string }) {
        if (event.action === 'view') {
            // Lógica futura para ver la cotización interactiva o PDF
            alert('Apertura de Cotización Interactiva próximamente...');
        }
    }
}
