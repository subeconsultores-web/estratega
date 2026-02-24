import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanzasService } from '../../../core/services/finanzas.service';
import { MetricasFinancieras } from '../../../core/models/finanzas.model';
import { Factura } from '../../../core/models/factura.model';
import { RouterModule } from '@angular/router';
import { LUCIDE_ICONS, LucideIconProvider,  LucideAngularModule, ArrowDownToLine, ArrowUpFromLine, ArrowUpRight, BarChart3, Clock, CreditCard, List, TrendingUp  } from 'lucide-angular';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-dashboard-financiero',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule, BaseChartDirective],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ ArrowDownToLine, ArrowUpFromLine, ArrowUpRight, BarChart3, Clock, CreditCard, List, TrendingUp }) }
  ],
    templateUrl: './dashboard-financiero.component.html'
})
export class DashboardFinancieroComponent implements OnInit {
    private finanzasService = inject(FinanzasService);

    metricas: MetricasFinancieras | null = null;
    isLoading = true;

    proximosCobros$!: Observable<Factura[]>;

    public lineChartType: ChartType = 'line';
    public lineChartData: ChartConfiguration['data'] = {
        datasets: [],
        labels: []
    };
    public lineChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        elements: {
            line: { tension: 0.4 }
        },
        scales: {
            y: { beginAtZero: true }
        }
    };

    ngOnInit(): void {
        this.cargarMetricas();
        this.proximosCobros$ = this.finanzasService.getProximosCobros(5);
    }

    async cargarMetricas() {
        this.isLoading = true;
        try {
            this.metricas = await this.finanzasService.getMetricasResumen();
            if (this.metricas && this.metricas.historial) {
                this.lineChartData = {
                    labels: this.metricas.historial.map(h => h.fecha),
                    datasets: [
                        {
                            data: this.metricas.historial.map(h => h.ingresos),
                            label: 'Ingresos',
                            borderColor: '#10B981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            fill: true,
                        },
                        {
                            data: this.metricas.historial.map(h => h.egresos),
                            label: 'Egresos',
                            borderColor: '#EF4444',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            fill: true,
                        }
                    ]
                };
            }
        } catch (e) {
            console.error('Error al cargar metricas financieras:', e);
        } finally {
            this.isLoading = false;
        }
    }
}
