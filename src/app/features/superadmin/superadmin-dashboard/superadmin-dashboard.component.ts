import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SuperAdminService, Tenant } from '../../../core/services/super-admin.service';
import { LUCIDE_ICONS, LucideIconProvider, LucideAngularModule, Activity, Bot, Briefcase, CheckSquare, Clock, DollarSign, Loader2, PanelLeftClose, Search, ShieldCheck, TrendingUp, TrendingDown } from 'lucide-angular';
import { ToastrService } from 'ngx-toastr';
import { EmptyState } from '../../../shared/components/empty-state/empty-state.component';
import { SkillRadarComponent } from '../../../shared/components/skill-radar/skill-radar.component';
import { DataNodeGraphComponent } from '../../../shared/components/data-node-graph/data-node-graph.component';
import { ChurnRadarComponent } from '../../../shared/components/churn-radar/churn-radar.component';
import { MagicProposalComponent } from '../../../shared/components/magic-proposal/magic-proposal.component';
import { ProofOfCompetenceReplayComponent } from '../../../shared/components/proof-of-competence-replay/proof-of-competence-replay.component';
import { AdaptiveGreetingComponent } from '../../../shared/components/adaptive-greeting/adaptive-greeting.component';

@Component({
    selector: 'app-superadmin-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule, DatePipe, EmptyState, SkillRadarComponent, DataNodeGraphComponent, ChurnRadarComponent, MagicProposalComponent, ProofOfCompetenceReplayComponent, AdaptiveGreetingComponent],
    providers: [
        { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Activity, Bot, Briefcase, CheckSquare, Clock, DollarSign, Loader2, PanelLeftClose, Search, ShieldCheck, TrendingUp, TrendingDown }) }
    ],
    templateUrl: './superadmin-dashboard.component.html'
})
export class SuperAdminDashboardComponent implements OnInit {
    private saasService = inject(SuperAdminService);
    private toastr = inject(ToastrService);
    private destroyRef = inject(DestroyRef);

    tenants: Tenant[] = [];
    metrics = { total: 0, active: 0, trial: 0, mrr: 0 };
    isLoading = true;

    ngOnInit() {
        this.saasService.getTenants().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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

    trackById(index: number, item: any): string { return item.id; }
}
