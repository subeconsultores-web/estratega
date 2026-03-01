import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LUCIDE_ICONS, LucideIconProvider, LucideAngularModule, FileSignature, Loader2, Plus } from 'lucide-angular';
import { ToastrService } from 'ngx-toastr';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';

import { ContratoService } from '../../../core/services/contrato.service';
import { AuthService } from '../../../core/services/auth.service';
import { Contrato } from '../../../core/models/contrato.model';
import { DataTableComponent, ColumnDef } from '../../../shared/components/data-table/data-table.component';
import { EmptyState } from '../../../shared/components/empty-state/empty-state.component';

@Component({
    selector: 'app-contratos-list',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule, DataTableComponent, EmptyState],
    providers: [
        { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ FileSignature, Loader2, Plus }) }
    ],
    templateUrl: './contratos-list.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContratosListComponent implements OnInit {
    private contratoService = inject(ContratoService);
    private authService = inject(AuthService);
    private router = inject(Router);
    private toastr = inject(ToastrService);
    private cdr = inject(ChangeDetectorRef);
    private confirmDialog = inject(ConfirmDialogService);
    private destroyRef = inject(DestroyRef);

    contratos: Contrato[] = [];
    isLoading = true;

    columns: ColumnDef[] = [
        { key: 'correlativo', label: 'ID', sortable: true },
        { key: 'titulo', label: 'Contrato', sortable: true },
        { key: 'fechaValidez', label: 'Validez Hasta', type: 'date', sortable: true },
        { key: 'estadoActual', label: 'Estado', type: 'badge', sortable: true },
        { key: 'actions', label: 'Acciones', type: 'action' }
    ];

    ngOnInit(): void {
        this.loadContratos();
    }

    async loadContratos() {
        this.isLoading = true;
        try {
            const tenantId = await this.authService.getTenantId();
            if (!tenantId) {
                this.toastr.error('No se pudo identificar la compañía (tenant)');
                this.isLoading = false;
                this.cdr.detectChanges();
                return;
            }

            this.contratoService.getContratos(tenantId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
                next: (data) => {
                    this.contratos = data.map(c => ({
                        ...c,
                        fechaValidez: c.fechaValidez?.toDate ? c.fechaValidez.toDate() : new Date(c.fechaValidez)
                    }));
                    this.isLoading = false;
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    console.error('[Contratos] Error cargando contratos:', err);
                    this.toastr.error('Error cargando los contratos');
                    this.contratos = [];
                    this.isLoading = false;
                    this.cdr.detectChanges();
                }
            });
        } catch (e) {
            console.error('[Contratos] Exception in loadContratos:', e);
            this.contratos = [];
            this.isLoading = false;
            this.cdr.detectChanges();
        }
    }

    async onAction(event: { action: string, item: any }) {
        if (event.action === 'edit' || event.action === 'view') {
            const routePath = event.action === 'view' ? `/contratos/${event.item.id}/view` : `/contratos/${event.item.id}`;
            this.router.navigate([routePath]);
        } else if (event.action === 'delete') {
            const ok = await this.confirmDialog.confirm({
                title: 'Cancelar contrato',
                message: '¿Seguro de que deseas cancelar este acuerdo? Esta acción no se puede deshacer.',
                variant: 'warning',
                confirmText: 'Cancelar contrato'
            });
            if (ok) {
                this.contratoService.cambiarEstado(event.item.id, 'Cancelado').then(() => {
                    this.toastr.info('Contrato cancelado exitosamente');
                }).catch(e => {
                    console.error(e);
                    this.toastr.error('Hubo un error cancelando el contrato');
                });
            }
        }
    }

    goToNuevoContrato() {
        this.router.navigate(['/contratos/new']);
    }
}
