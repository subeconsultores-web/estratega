import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LUCIDE_ICONS, LucideIconProvider,  LucideAngularModule, ArrowUpFromLine, Briefcase, CheckSquare, ChevronRight, Clock, DollarSign, FileText, Plus, Settings, Sparkles, TrendingUp  } from 'lucide-angular';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { EmptyState } from '../../shared/components/empty-state/empty-state.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { FinanzasService } from '../../core/services/finanzas.service';
import { ForecastDashboardComponent } from './forecast/forecast.component';
import { UpsellingWidgetComponent } from '../crm/components/upselling-widget/upselling-widget.component';
import { AuthService } from '../../core/services/auth.service';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, BaseChartDirective, EmptyState, StatCardComponent, ForecastDashboardComponent, UpsellingWidgetComponent],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ ArrowUpFromLine, Briefcase, CheckSquare, ChevronRight, Clock, DollarSign, FileText, Plus, Settings, Sparkles, TrendingUp }) }
  ],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
    private finanzas = inject(FinanzasService);
    private authService = inject(AuthService);

    // KPIs mapped to StatCard component inputs
    kpis = [] as any[];
    isLoading = true;

    async ngOnInit() {
        this.isLoading = true;
        try {
            // Esperar a que el tenantId esté disponible antes de cargar métricas
            await firstValueFrom(this.authService.tenantId$);
            const m = await this.finanzas.getMetricasResumen();
            this.kpis = [
                { label: 'Ingresos Operativos', value: m.ingresosMesActual, type: 'currency', trend: 'up', trendText: '30 días', trendDesc: 'recaudado', icon: 'check-square', color: 'accent' },
                { label: 'MRR / Recurrente', value: m.mrr, type: 'currency', trend: 'up', trendText: `+${m.crecimientoMRR}%`, trendDesc: 'vs mes anterior', icon: 'trending-up', color: 'primary' },
                { label: 'Egresos Caja', value: m.egresosMesActual, type: 'currency', trend: 'down', trendText: 'Operativo', trendDesc: 'salidas', icon: 'arrow-up-from-line', color: 'secondary' },
                { label: 'Facturado Pendiente', value: m.porCobrar, type: 'currency', trend: 'down', trendText: 'Urgente', trendDesc: 'AR general', icon: 'dollar-sign', color: 'danger' }
            ];
        } catch (e) {
            console.error('Core Dashboard KPI Error', e);
        } finally {
            this.isLoading = false;
        }
    }

    // Estratega IA insight mock
    estrategaInsights = [
        "La tasa de conversión de cotizaciones ha bajado un 2%. Sugiero revisar el pricing del 'Servicio de Consultoría IT'.",
        "Tienes 3 facturas vencidas por un total de $1.1M. ¿Quieres que envíe recordatorios automáticos?",
        "El proyecto 'Migración Cloud' está al 85% de su presupuesto de horas. Recomiendo alertar al Project Manager."
    ];

    // Bar Chart Configuration (Ingresos vs Gastos)
    public barChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: true, position: 'bottom', labels: { color: '#9CA3AF' } },
        },
        scales: {
            y: { ticks: { color: '#9CA3AF' }, grid: { color: '#374151' } },
            x: { ticks: { color: '#9CA3AF' }, grid: { color: '#374151' } }
        }
    };
    public barChartType: ChartType = 'bar';
    public barChartData: ChartData<'bar'> = {
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
        datasets: [
            { data: [6500000, 5900000, 8000000, 8100000, 5600000, 8200000], label: 'Ingresos', backgroundColor: '#3F83F8', borderRadius: 4 },
            { data: [2800000, 4800000, 4000000, 1900000, 8600000, 2700000], label: 'Gastos', backgroundColor: '#F87171', borderRadius: 4 }
        ]
    };

    // Doughnut Chart Configuration (Distribución de Horas)
    public doughnutChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: true, position: 'right', labels: { color: '#9CA3AF' } }
        }
    };
    public doughnutChartType: ChartType = 'doughnut';
    public doughnutChartData: ChartData<'doughnut'> = {
        labels: ['Consultoría', 'Desarrollo', 'Soporte', 'Reuniones'],
        datasets: [
            {
                data: [350, 450, 100, 50],
                backgroundColor: ['#3F83F8', '#1A56DB', '#E02424', '#FACA15'],
                borderWidth: 0
            }
        ]
    };
}
