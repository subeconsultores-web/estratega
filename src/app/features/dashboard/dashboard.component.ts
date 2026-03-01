import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LUCIDE_ICONS, LucideIconProvider, LucideAngularModule, ArrowUpFromLine, Briefcase, CheckSquare, ChevronRight, Clock, DollarSign, FileText, Plus, Settings, Sparkles, TrendingUp, Users, AlertCircle } from 'lucide-angular';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { EmptyState } from '../../shared/components/empty-state/empty-state.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { FinanzasService } from '../../core/services/finanzas.service';
import { ProyectosService } from '../../core/services/proyectos.service';
import { TareasService } from '../../core/services/tareas.service';
import { CrmService } from '../../core/services/crm.service';
import { ForecastDashboardComponent } from './forecast/forecast.component';
import { UpsellingWidgetComponent } from '../crm/components/upselling-widget/upselling-widget.component';
import { AuthService } from '../../core/services/auth.service';
import { firstValueFrom } from 'rxjs';
import { Actividad } from '../../core/models/crm.model';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule, BaseChartDirective, EmptyState, StatCardComponent, ForecastDashboardComponent, UpsellingWidgetComponent],
    providers: [
        provideCharts(withDefaultRegisterables()),
        { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ AlertCircle, ArrowUpFromLine, Briefcase, CheckSquare, ChevronRight, Clock, DollarSign, FileText, Plus, Settings, Sparkles, TrendingUp, Users }) }
    ],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
    private finanzas = inject(FinanzasService);
    private proyectosService = inject(ProyectosService);
    private tareasService = inject(TareasService);
    private crmService = inject(CrmService);
    private authService = inject(AuthService);
    private cdr = inject(ChangeDetectorRef);
    private destroyRef = inject(DestroyRef);

    // KPIs mapped to StatCard component inputs
    kpis = [] as any[];
    isLoading = true;
    kpiError = false;

    // Dynamic activity timeline
    recentActivities: Actividad[] = [];
    activitiesLoading = true;

    // Dynamic pending tasks count
    pendingTasksCount = 0;

    private buildKpis(m: { ingresosMesActual: number; mrr: number; egresosMesActual: number; porCobrar: number; crecimientoMRR: number }) {
        return [
            { label: 'Ingresos Operativos', value: m.ingresosMesActual, type: 'currency', trend: 'up', trendText: '30 días', trendDesc: 'recaudado', icon: 'check-square', color: 'accent' },
            { label: 'MRR / Recurrente', value: m.mrr, type: 'currency', trend: 'up', trendText: `+${m.crecimientoMRR}%`, trendDesc: 'vs mes anterior', icon: 'trending-up', color: 'primary' },
            { label: 'Egresos Caja', value: m.egresosMesActual, type: 'currency', trend: 'down', trendText: 'Operativo', trendDesc: 'salidas', icon: 'arrow-up-from-line', color: 'secondary' },
            { label: 'Facturado Pendiente', value: m.porCobrar, type: 'currency', trend: 'down', trendText: 'Urgente', trendDesc: 'AR general', icon: 'dollar-sign', color: 'danger' }
        ];
    }

    async ngOnInit() {
        this.isLoading = true;
        try {
            // Wait for tenantId before loading metrics
            await firstValueFrom(this.authService.tenantId$);
            const m = await this.finanzas.getMetricasResumen();
            this.kpis = this.buildKpis(m);

            // Feed bar chart with real historial data
            this.buildBarChart(m.historial || []);

            // Feed doughnut with real project status distribution
            this.loadProjectDistribution();

            // Load recent activities for timeline
            this.loadRecentActivities();
        } catch (e) {
            console.error('Core Dashboard KPI Error', e);
            this.kpiError = true;
            this.kpis = this.buildKpis({ ingresosMesActual: 0, mrr: 0, egresosMesActual: 0, porCobrar: 0, crecimientoMRR: 0 });
        } finally {
            this.isLoading = false;
            this.cdr.markForCheck();
        }
    }

    // IA Insights — dynamic based on actual KPI state
    get estrategaInsights(): string[] {
        if (this.isLoading || this.kpiError) return [];
        const insights: string[] = [];
        const porCobrar = this.kpis.find((k: any) => k.label === 'Facturado Pendiente')?.value || 0;
        const egresos = this.kpis.find((k: any) => k.label === 'Egresos Caja')?.value || 0;
        const ingresos = this.kpis.find((k: any) => k.label === 'Ingresos Operativos')?.value || 0;

        if (porCobrar > 0) {
            insights.push(`Tienes $${(porCobrar).toLocaleString('es-CL')} en facturas pendientes de cobro. Revisa la sección de Facturación para dar seguimiento.`);
        }
        if (egresos > ingresos && ingresos > 0) {
            insights.push(`Los egresos ($${(egresos).toLocaleString('es-CL')}) superan a los ingresos este mes. Revisa los gastos operativos.`);
        }
        if (ingresos === 0 && egresos === 0 && porCobrar === 0) {
            insights.push('Aún no hay movimientos financieros este mes. Comienza registrando tus primeras transacciones o cotizaciones.');
        }
        if (insights.length === 0) {
            insights.push('Tus indicadores financieros se ven saludables. ¡Sigue así!');
        }
        return insights;
    }

    // Bar Chart — fed from real FinanzasService historial
    public barChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: true, position: 'bottom', labels: { color: this.chartTextColor } },
        },
        scales: {
            y: { ticks: { color: this.chartTextColor }, grid: { color: this.chartGridColor } },
            x: { ticks: { color: this.chartTextColor }, grid: { color: this.chartGridColor } }
        }
    };
    public barChartType: ChartType = 'bar';
    public barChartData: ChartData<'bar'> = {
        labels: [],
        datasets: [
            { data: [], label: 'Ingresos', backgroundColor: '#3F83F8', borderRadius: 4 },
            { data: [], label: 'Gastos', backgroundColor: '#F87171', borderRadius: 4 }
        ]
    };
    public hasBarData = false;

    private buildBarChart(historial: { fecha: string; ingresos: number; egresos: number }[]) {
        if (!historial.length) {
            this.hasBarData = false;
            return;
        }
        this.hasBarData = true;
        this.barChartData = {
            labels: historial.map(h => {
                const d = new Date(h.fecha);
                return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
            }),
            datasets: [
                { data: historial.map(h => h.ingresos), label: 'Ingresos', backgroundColor: '#3F83F8', borderRadius: 4 },
                { data: historial.map(h => h.egresos), label: 'Gastos', backgroundColor: '#F87171', borderRadius: 4 }
            ]
        };
    }

    // Doughnut Chart — fed from real project status distribution
    public doughnutChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: true, position: 'right', labels: { color: this.chartTextColor } }
        }
    };
    public doughnutChartType: ChartType = 'doughnut';
    public doughnutChartData: ChartData<'doughnut'> = {
        labels: [],
        datasets: [{ data: [], backgroundColor: [], borderWidth: 0 }]
    };
    public hasDoughnutData = false;

    private loadProjectDistribution() {
        this.proyectosService.getProyectos()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(proyectos => {
                const statusMap = new Map<string, number>();
                proyectos.forEach(p => {
                    const estado = p.estado || 'Sin estado';
                    statusMap.set(estado, (statusMap.get(estado) || 0) + 1);
                });

                if (statusMap.size === 0) {
                    this.hasDoughnutData = false;
                } else {
                    this.hasDoughnutData = true;
                    const colorPalette = ['#3F83F8', '#1A56DB', '#FACA15', '#E02424', '#10B981', '#8B5CF6'];
                    const entries = Array.from(statusMap.entries());
                    this.doughnutChartData = {
                        labels: entries.map(([label]) => label),
                        datasets: [{
                            data: entries.map(([, count]) => count),
                            backgroundColor: entries.map((_, i) => colorPalette[i % colorPalette.length]),
                            borderWidth: 0
                        }]
                    };
                }
                this.cdr.markForCheck();
            });
    }

    private loadRecentActivities() {
        this.activitiesLoading = true;
        this.crmService.getClientes()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(clientes => {
                // Load up to 5 most recent activities across all clients
                if (clientes.length > 0 && clientes[0]?.id) {
                    this.crmService.getActividadesCliente(clientes[0].id)
                        .pipe(takeUntilDestroyed(this.destroyRef))
                        .subscribe(actividades => {
                            this.recentActivities = actividades.slice(0, 5);
                            this.activitiesLoading = false;
                            this.cdr.markForCheck();
                        });
                } else {
                    this.recentActivities = [];
                    this.activitiesLoading = false;
                    this.cdr.markForCheck();
                }
            });
    }

    getActivityIcon(tipo: string): string {
        switch (tipo) {
            case 'llamada': return 'phone';
            case 'email': return 'file-text';
            case 'reunion': return 'users';
            case 'nota': return 'file-text';
            default: return 'clock';
        }
    }

    formatTimeAgo(fecha: any): string {
        if (!fecha) return '';
        const date = fecha?.toDate ? fecha.toDate() : new Date(fecha);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHrs = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffHrs < 24) return `Hace ${diffHrs} horas`;
        if (diffDays === 1) return 'Ayer';
        return `Hace ${diffDays} días`;
    }

    trackByIndex(index: number): number { return index; }
    trackByKpi(index: number, item: any): string { return item.label; }
    trackByActivity(index: number, item: any): string { return item.id ?? index; }
    trackByInsight(index: number, item: string): string { return item; }

    private get chartTextColor(): string {
        return getComputedStyle(document.documentElement).getPropertyValue('--color-txt-secondary').trim() || '#9CA3AF';
    }
    private get chartGridColor(): string {
        return getComputedStyle(document.documentElement).getPropertyValue('--color-border').trim() || '#374151';
    }
}
