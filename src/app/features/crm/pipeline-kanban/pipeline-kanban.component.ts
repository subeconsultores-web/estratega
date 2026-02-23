import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { CrmService } from '../../../core/services/crm.service';
import { Cliente } from '../../../core/models/crm.model';
import { ToastrService } from 'ngx-toastr';
import { RouterModule } from '@angular/router';
import { ScoringService } from '../../../core/services/scoring.service';

@Component({
    selector: 'app-pipeline-kanban',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, RouterModule],
    templateUrl: './pipeline-kanban.component.html'
})
export class PipelineKanbanComponent implements OnInit {
    private crmService = inject(CrmService);
    public scoringService = inject(ScoringService);
    private toastr = inject(ToastrService);

    isLoading = true;
    clientes: Cliente[] = [];

    // Derived state columns
    leads: Cliente[] = [];
    prospectos: Cliente[] = [];
    activos: Cliente[] = [];

    ngOnInit() {
        this.loadClientes();
    }

    loadClientes() {
        this.isLoading = true;
        this.crmService.getClientes().subscribe({
            next: (data: Cliente[]) => {
                this.clientes = data;
                this.filterColumns();
                this.isLoading = false;
            },
            error: (err: any) => {
                console.error('Error fetching pipeline', err);
                this.toastr.error('Error al cargar datos del pipeline');
                this.isLoading = false;
            }
        });
    }

    filterColumns() {
        this.leads = this.clientes.filter(c => c.estado === 'lead');
        this.prospectos = this.clientes.filter(c => c.estado === 'prospecto');
        this.activos = this.clientes.filter(c => c.estado === 'activo');
    }

    get totalValue(): number {
        return this.clientes.reduce((sum, c) => sum + (c.totalHistorico || 0), 0);
    }

    async moveClient(cliente: Cliente, newStatus: 'lead' | 'prospecto' | 'activo' | 'inactivo') {
        try {
            if (!cliente.id) return;
            await this.crmService.updateCliente(cliente.id!, { estado: newStatus });
            this.toastr.success(`${cliente.nombreEmpresa} movido a ${newStatus}`, 'Pipeline Actualizado');
            // Subscriptions from Firestore automatically trigger an update
        } catch (e) {
            console.error(e);
            this.toastr.error('No se pudo mover el cliente');
        }
    }

    formatCurrency(value: number | undefined): string {
        if (value == null) value = 0;
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);
    }
}
