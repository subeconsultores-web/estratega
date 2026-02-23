import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SuperAdminService, Tenant } from '../../../core/services/super-admin.service';
import { LucideAngularModule } from 'lucide-angular';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-superadmin-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule, DatePipe],
    templateUrl: './superadmin-dashboard.component.html'
})
export class SuperAdminDashboardComponent implements OnInit {
    private saasService = inject(SuperAdminService);
    private toastr = inject(ToastrService);

    tenants: Tenant[] = [];
    metrics = { total: 0, active: 0, trial: 0, mrr: 0 };
    isLoading = true;

    ngOnInit() {
        this.saasService.getTenants().subscribe({
            next: (data) => {
                this.tenants = data;
                this.calculateMetrics(data);
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error fetching tenants', err);
                this.toastr.error('Error cargando tenants (Verifica tus permisos).');
                this.isLoading = false;
            }
        });
    }

    calculateMetrics(data: Tenant[]) {
        this.metrics.total = data.length;
        this.metrics.active = data.filter(t => t.isActive).length;
        this.metrics.trial = data.filter(t => t.plan === 'trial').length;

        // Fake MRR calc: say pro = $50, trial = $0, enterprise = $150
        this.metrics.mrr = data.filter(t => t.isActive).reduce((acc, t) => {
            if (t.plan === 'pro') return acc + 50;
            if (t.plan === 'enterprise') return acc + 150;
            return acc;
        }, 0);
    }

    async toggleStatus(tenant: Tenant) {
        const newStatus = !tenant.isActive;
        try {
            await this.saasService.setTenantStatus(tenant.id, newStatus);
            const action = newStatus ? 'activado' : 'suspendido';
            this.toastr.success(`Tenant ${tenant.nombre} ${action}.`);
        } catch (e) {
            this.toastr.error('No se pudo actualizar el estado del tenant.');
        }
    }

    async changePlan(tenant: Tenant, newPlan: string) {
        try {
            await this.saasService.changeTenantPlan(tenant.id, newPlan);
            this.toastr.success(`Plan de ${tenant.nombre} cambiado a ${newPlan}.`);
        } catch (e) {
            this.toastr.error('No se pudo actualizar el plan.');
        }
    }

    // Utilidad simple para castear timestamp a Date
    getDate(createdAt: any): Date {
        return createdAt?.toDate ? createdAt.toDate() : new Date();
    }
}
