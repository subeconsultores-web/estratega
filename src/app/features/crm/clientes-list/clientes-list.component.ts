import { Component, inject, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LUCIDE_ICONS, LucideIconProvider, LucideAngularModule, KanbanSquare, Plus, Search, Users } from 'lucide-angular';
import { CrmService } from '../../../core/services/crm.service';
import { Cliente } from '../../../core/models/crm.model';
import { DataTableComponent, ColumnDef } from '../../../shared/components/data-table/data-table.component';
import { ToastrService } from 'ngx-toastr';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';

@Component({
    selector: 'app-clientes-list',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule, DataTableComponent],
    providers: [
        { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ KanbanSquare, Plus, Search, Users }) }
    ],
    templateUrl: './clientes-list.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientesListComponent implements OnInit {
    private crmService = inject(CrmService);
    private router = inject(Router);
    private toastr = inject(ToastrService);
    private cdr = inject(ChangeDetectorRef);
    private destroyRef = inject(DestroyRef);
    private confirmDialog = inject(ConfirmDialogService);

    clientes: Cliente[] = [];
    isLoading = true;

    columns: ColumnDef[] = [
        { key: 'nombreEmpresa', label: 'Empresa', sortable: true },
        { key: 'score', label: 'Score IA', type: 'score', sortable: true },
        { key: 'rut', label: 'RUT' },
        { key: 'estado', label: 'Estado', type: 'badge', sortable: true },
        { key: 'pipelineEtapa', label: 'Etapa', sortable: true },
        { key: 'totalHistorico', label: 'Facturado', type: 'currency', sortable: true },
        { key: 'actions', label: 'Acciones', type: 'action' }
    ];

    ngOnInit() {
        this.loadClientes();
    }

    loadClientes() {
        this.isLoading = true;
        this.crmService.getClientes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data: Cliente[]) => {
                this.clientes = data;
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err: any) => {
                console.error('[ClientesList] Error al cargar clientes', err);
                this.toastr.error('No se pudieron cargar los clientes', 'Error');
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    async handleAction(event: { item: Cliente, action: string }) {
        if (event.action === 'edit') {
            this.router.navigate(['/crm/clientes', event.item.id, 'editar']);
        } else if (event.action === 'view') {
            this.router.navigate(['/crm/clientes', event.item.id]);
        } else if (event.action === 'delete') {
            if (!event.item.id) return;
            const ok = await this.confirmDialog.confirm({
                title: 'Eliminar cliente',
                message: `¿Estás seguro de eliminar a ${event.item.nombreEmpresa}? Esta acción no se puede deshacer.`,
                variant: 'danger',
                confirmText: 'Eliminar'
            });
            if (ok) {
                this.crmService.deleteCliente(event.item.id).then(() => {
                    this.toastr.success('Cliente eliminado correctamente', 'Éxito');
                }).catch(err => {
                    console.error(err);
                    this.toastr.error('Error al eliminar cliente', 'Error');
                });
            }
        }
    }
}
