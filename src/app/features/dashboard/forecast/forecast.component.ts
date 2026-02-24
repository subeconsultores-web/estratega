import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LUCIDE_ICONS, LucideIconProvider,  LucideAngularModule, AlertTriangle, Bell, Bot, Sparkles, Target  } from 'lucide-angular';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { ForecastService, ForecastResponse } from '../services/forecast.service';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-forecast-dashboard',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, BaseChartDirective],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ AlertTriangle, Bell, Bot, Sparkles, Target }) }
  ],
    templateUrl: './forecast.component.html'
})
export class ForecastDashboardComponent implements OnInit {
    private forecastService = inject(ForecastService);
    private toastr = inject(ToastrService);

    isLoading = true;
    data: ForecastResponse | null = null;
    error: string | null = null;

    // Line Chart Configuration
    public lineChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: true, position: 'top', labels: { color: '#9CA3AF' } }
        },
        scales: {
            y: { ticks: { color: '#9CA3AF' }, grid: { color: '#374151' } },
            x: { ticks: { color: '#9CA3AF' }, grid: { color: '#374151' } }
        }
    };
    public lineChartType: ChartType = 'line';
    public lineChartData: ChartData<'line'> = {
        labels: [],
        datasets: []
    };

    ngOnInit() {
        this.loadForecast();
    }

    async loadForecast() {
        this.isLoading = true;
        this.error = null;
        try {
            this.data = await this.forecastService.getForecast();
            this.prepareChartData();
        } catch (e: any) {
            console.error('Error cargando forecast', e);
            this.error = 'No se pudo cargar el análisis predictivo. Verifica tu conexión o plan.';
            this.toastr.error('Error al cargar la IA Predictiva');
        } finally {
            this.isLoading = false;
        }
    }

    prepareChartData() {
        if (!this.data) return;

        // Construir gráfico simple:
        // Mes Actual Base vs Predicción (estimada simplificada para el gráfico)
        const d = new Date();
        const currentMonthLabel = d.toLocaleDateString('es-CL', { month: 'short' });

        d.setMonth(d.getMonth() + 1);
        const nextMonthLabel = d.toLocaleDateString('es-CL', { month: 'short' });

        d.setMonth(d.getMonth() + 1);
        const nextNextMonthLabel = d.toLocaleDateString('es-CL', { month: 'short' });

        const base = this.data.datosBase.montoRecurrenteMensual;
        const totalMes1 = this.data.prediccionIA.ingresoEsperadoMesActual || (base + this.data.datosBase.montoFacturasPendientes);
        // Distribución hipotética de la predicción 90 días entre los 3 meses
        const total90 = this.data.prediccionIA.prediccion90Dias;
        const remaining = Math.max(0, total90 - totalMes1);
        const totalMes2 = base + (remaining * 0.6);
        const totalMes3 = base + (remaining * 0.4);

        this.lineChartData = {
            labels: [currentMonthLabel, nextMonthLabel, nextNextMonthLabel],
            datasets: [
                {
                    data: [totalMes1, totalMes2, totalMes3],
                    label: 'Proyección Optimista (IA)',
                    borderColor: '#10B981', // Verde success
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    fill: true,
                    tension: 0.4
                },
                {
                    data: [base, base, base],
                    label: 'Ingreso Recurrente Asegurado',
                    borderColor: '#3B82F6', // Azul primary
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0
                }
            ]
        };
    }

    formatCurrency(value: number | undefined): string {
        if (value == null) return '$0';
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);
    }

    getIconForAlert(tipo: string): string {
        switch (tipo) {
            case 'warning': return 'alert-triangle';
            case 'success': return 'check-circle';
            case 'info': return 'info';
            default: return 'bell';
        }
    }

    getColorForAlert(tipo: string): string {
        switch (tipo) {
            case 'warning': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            case 'success': return 'text-green-500 bg-green-500/10 border-green-500/20';
            case 'info': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
        }
    }
}
