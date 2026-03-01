import { Component, inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanzasService } from '../../../core/services/finanzas.service';
import { MetricasFinancieras } from '../../../core/models/finanzas.model';
import { Factura } from '../../../core/models/factura.model';
import { RouterModule } from '@angular/router';
import { LUCIDE_ICONS, LucideIconProvider, LucideAngularModule, ArrowDownToLine, ArrowUpFromLine, ArrowUpRight, BarChart3, Clock, CreditCard, List, TrendingUp } from 'lucide-angular';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { Observable, of, catchError } from 'rxjs';

@Component({
    selector: 'app-dashboard-financiero',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule, BaseChartDirective],
    providers: [
        provideCharts(withDefaultRegisterables()),
        { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ ArrowDownToLine, ArrowUpFromLine, ArrowUpRight, BarChart3, Clock, CreditCard, List, TrendingUp }) }
    ],
    templateUrl: './dashboard-financiero.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardFinancieroComponent implements OnInit {
    private finanzasService = inject(FinanzasService);
    private cdr = inject(ChangeDetectorRef);

    metricas: MetricasFinancieras | null = null;
    isLoading = true;
    hasError = false;

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
        this.proximosCobros$ = this.finanzasService.getProximosCobros(5).pipe(
            catchError(err => {
                console.error('Error cargando próximos cobros:', err);
                return of([] as Factura[]);
            })
        );
    }

    trackByIndex(index: number): number { return index; }
    trackById(index: number, item: any): string { return item.id; }

    async cargarMetricas() {
        this.isLoading = true;
        this.hasError = false;
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
            this.hasError = true;
            // Provide default empty metricas so the dashboard renders with $0 instead of infinite spinner
            this.metricas = {
                mrr: 0,
                ingresosMesActual: 0,
                egresosMesActual: 0,
                porCobrar: 0,
                crecimientoMRR: 0,
                historial: []
            };
        } finally {
            this.isLoading = false;
            this.cdr.detectChanges();
        }
    }
}
