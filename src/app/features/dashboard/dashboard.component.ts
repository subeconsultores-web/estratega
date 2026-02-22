import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { EmptyState } from '../../shared/components/empty-state/empty-state.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, BaseChartDirective, EmptyState, StatCardComponent],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
    // KPIs Mock Data mapped to StatCard component inputs
    kpis = [
        { label: 'Cotizado del Mes', value: 12500000, type: 'currency', trend: 'up', trendText: '+15%', trendDesc: 'vs mes anterior', icon: 'file-badge', color: 'primary' },
        { label: 'Facturado del Mes', value: 8200000, type: 'currency', trend: 'up', trendText: '+8%', trendDesc: 'vs mes anterior', icon: 'check-square', color: 'accent' },
        { label: 'Tasa de Conversión', value: '42%', type: 'text', trend: 'down', trendText: '-2%', trendDesc: 'vs mes anterior', icon: 'users', color: 'secondary' },
        { label: 'Horas (Semana)', value: '164h', type: 'text', trend: 'up', trendText: '+5h', trendDesc: 'vs semana anterior', icon: 'clock', color: 'primary' },
        { label: 'Por Cobrar Vencido', value: 1100000, type: 'currency', trend: 'down', trendText: 'Urgente', trendDesc: '3 facturas', icon: 'dollar-sign', color: 'danger' }
    ] as any[];

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
