import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { EmptyState } from '../../shared/components/empty-state/empty-state.component';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, BaseChartDirective, EmptyState],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
    // KPIs Mock Data
    kpis = [
        { label: 'Cotizado del Mes', value: '$12.5M', trend: '+15%', trendUp: true, icon: 'file-badge', color: 'bg-blue-500' },
        { label: 'Facturado del Mes', value: '$8.2M', trend: '+8%', trendUp: true, icon: 'check-square', color: 'bg-emerald-500' },
        { label: 'Tasa de Conversión', value: '42%', trend: '-2%', trendUp: false, icon: 'users', color: 'bg-indigo-500' },
        { label: 'Horas (Semana)', value: '164h', trend: '+5h', trendUp: true, icon: 'clock', color: 'bg-purple-500' },
        { label: 'Por Cobrar Vencido', value: '$1.1M', trend: 'Urgent', trendUp: false, icon: 'dollar-sign', color: 'bg-rose-500' }
    ];

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
            legend: { display: true, position: 'bottom' },
        }
    };
    public barChartType: ChartType = 'bar';
    public barChartData: ChartData<'bar'> = {
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
        datasets: [
            { data: [6500000, 5900000, 8000000, 8100000, 5600000, 8200000], label: 'Ingresos', backgroundColor: '#1A56DB', borderRadius: 4 },
            { data: [2800000, 4800000, 4000000, 1900000, 8600000, 2700000], label: 'Gastos', backgroundColor: '#F87171', borderRadius: 4 }
        ]
    };

    // Doughnut Chart Configuration (Distribución de Horas)
    public doughnutChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: true, position: 'right' }
        }
    };
    public doughnutChartType: ChartType = 'doughnut';
    public doughnutChartData: ChartData<'doughnut'> = {
        labels: ['Consultoría', 'Desarrollo', 'Soporte', 'Reuniones'],
        datasets: [
            {
                data: [350, 450, 100, 50],
                backgroundColor: [
                    '#3F83F8',
                    '#1A56DB',
                    '#E02424',
                    '#FACA15'
                ],
                borderWidth: 0
            }
        ]
    };
}
