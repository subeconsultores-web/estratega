import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EsgService } from '../../core/services/esg.service';
import { ResumenESG } from '../../core/models/sostenibilidad.model';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { LUCIDE_ICONS, LucideIconProvider,  LucideAngularModule, Leaf, Wind, Droplets, ArrowRight  } from 'lucide-angular';

@Component({
    selector: 'app-esg-dashboard',
    standalone: true,
    imports: [CommonModule, BaseChartDirective, LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Leaf, Wind, Droplets, ArrowRight }) }
  ],
    templateUrl: './esg-dashboard.component.html'
})
export class EsgDashboardComponent implements OnInit {
    private esgService = inject(EsgService);

    resumenes: ResumenESG[] = [];
    isLoading = true;

    // Chart Properties
    @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

    public doughnutChartType: ChartType = 'doughnut';
    public doughnutChartData: ChartData<'doughnut'> = {
        labels: [],
        datasets: [{
            data: [],
            backgroundColor: [
                '#10b981', // Emerald 500
                '#3b82f6', // Blue 500
                '#f59e0b', // Amber 500
                '#6366f1'  // Indigo 500
            ]
        }]
    };

    public doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom' }
        }
    };

    ngOnInit(): void {
        this.cargarDatos();
    }

    cargarDatos() {
        this.esgService.getRegistrosESG().subscribe({
            next: (registros) => {
                this.resumenes = this.esgService.agruparPorMes(registros);
                this.actualizarGrafico();
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error cargando ESG:', err);
                this.isLoading = false;
            }
        });
    }

    actualizarGrafico() {
        if (!this.resumenes || this.resumenes.length === 0) return;

        // Tomar los últimos 4 meses para la Dona
        const ultimosMeses = this.resumenes.slice(0, 4);

        this.doughnutChartData.labels = ultimosMeses.map(r => `Mes ${r.mes}/${r.anio}`);
        this.doughnutChartData.datasets[0].data = ultimosMeses.map(r => Math.round(r.totalCarbonoKgCO2eq));

        // Forzar re-render si el chart ya existe
        if (this.chart) {
            this.chart.update();
        }
    }
}
