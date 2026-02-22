import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { CrmService } from '../../../core/services/crm.service';
import { Cliente } from '../../../core/models/crm.model';
import { DataTableComponent, ColumnDef } from '../../../shared/components/data-table/data-table.component';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-clientes-list',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule, DataTableComponent],
    templateUrl: './clientes-list.component.html'
})
export class ClientesListComponent implements OnInit {
    private crmService = inject(CrmService);
    private router = inject(Router);
    private toastr = inject(ToastrService);

    clientes: Cliente[] = [];
    isLoading = true;

    columns: ColumnDef[] = [
        { key: 'nombreEmpresa', label: 'Empresa', sortable: true },
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
        this.crmService.getClientes().subscribe({
            next: (data: Cliente[]) => {
                this.clientes = data;
                this.isLoading = false;
            },
            error: (err: any) => {
                console.error('Error al cargar clientes', err);
                this.toastr.error('No se pudieron cargar los clientes', 'Error');
                this.isLoading = false;
            }
        });
    }

    handleAction(event: { item: Cliente, action: string }) {
        if (event.action === 'edit') {
            this.router.navigate(['/crm/clientes', event.item.id, 'editar']);
        } else if (event.action === 'view') {
            this.router.navigate(['/crm/clientes', event.item.id]);
        } else if (event.action === 'delete') {
            if (event.item.id && confirm(`¿Estás seguro de eliminar a ${event.item.nombreEmpresa}?`)) {
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
