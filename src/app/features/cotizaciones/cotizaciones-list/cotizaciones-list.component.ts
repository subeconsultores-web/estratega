import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LUCIDE_ICONS, LucideIconProvider, LucideAngularModule, FilePlus2, FileText, Search } from 'lucide-angular';
import { CotizacionService } from '../../../core/services/cotizacion.service';
import { CrmService } from '../../../core/services/crm.service';
import { Cotizacion } from '../../../core/models/cotizacion.model';
import { DataTableComponent, ColumnDef } from '../../../shared/components/data-table/data-table.component';
import { EmptyState } from '../../../shared/components/empty-state/empty-state.component';
import { ToastrService } from 'ngx-toastr';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { combineLatest } from 'rxjs';

@Component({
    selector: 'app-cotizaciones-list',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule, DataTableComponent, EmptyState],
    providers: [
        { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ FilePlus2, FileText, Search }) }
    ],
    templateUrl: './cotizaciones-list.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CotizacionesListComponent implements OnInit {
    private cotizacionService = inject(CotizacionService);
    private crmService = inject(CrmService);
    private router = inject(Router);
    private toastr = inject(ToastrService);
    private cdr = inject(ChangeDetectorRef);
    private confirmDialog = inject(ConfirmDialogService);
    private destroyRef = inject(DestroyRef);

    items: Cotizacion[] = [];
    isLoading = true;

    columns: ColumnDef[] = [
        { key: 'correlativo', label: 'Folio' },
        { key: 'clienteNombre', label: 'Cliente' },
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
        // Combine cotizaciones with clientes to resolve names
        combineLatest([
            this.cotizacionService.getCotizaciones(),
            this.crmService.getClientes()
        ]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: ([cotizaciones, clientes]) => {
                // Build a lookup map: clienteId -> nombreEmpresa
                const clienteMap = new Map<string, string>();
                clientes.forEach(c => { if (c.id) clienteMap.set(c.id, c.nombreEmpresa); });

                this.items = cotizaciones.map((c: Cotizacion) => ({
                    ...c,
                    clienteNombre: clienteMap.get(c.clienteId) || 'Cliente no encontrado'
                }));
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (e: any) => {
                this.toastr.error('Error cargando cotizaciones');
                console.error(e);
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    async onAction(event: { item: any, action: string } | any) {
        if (event.action === 'edit' || event.action === 'view') {
            this.router.navigate(['/cotizaciones', event.item.id]);
        } else if (event.action === 'delete') {
            const ok = await this.confirmDialog.confirm({
                title: 'Eliminar cotización',
                message: `¿Eliminar la cotización ${event.item.correlativo}? Esta acción no se puede deshacer.`,
                variant: 'danger',
                confirmText: 'Eliminar'
            });
            if (ok) {
                this.cotizacionService.deleteCotizacion(event.item.id).then(() => {
                    this.toastr.success('Cotización eliminada');
                });
            }
        }
    }

    goToNuevaCotizacion() {
        this.router.navigate(['/cotizaciones/nueva']);
    }

}

