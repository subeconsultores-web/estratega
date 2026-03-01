import { Component, inject, OnInit, ViewChild, DestroyRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { EsgService } from '../../core/services/esg.service';
import { ResumenESG } from '../../core/models/sostenibilidad.model';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { LUCIDE_ICONS, LucideIconProvider, LucideAngularModule, Leaf, Wind, Droplets, ArrowRight, FileText, Calculator, Trees, Plus, Loader2 } from 'lucide-angular';
import { EsgRecordModalComponent } from './components/esg-record-modal/esg-record-modal.component';

@Component({
    selector: 'app-esg-dashboard',
    standalone: true,
    imports: [CommonModule, BaseChartDirective, LucideAngularModule, EsgRecordModalComponent],
    providers: [
        provideCharts(withDefaultRegisterables()),
        { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Leaf, Wind, Droplets, ArrowRight, FileText, Calculator, Trees, Plus, Loader2 }) }
    ],
    templateUrl: './esg-dashboard.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EsgDashboardComponent implements OnInit {
    private esgService = inject(EsgService);
    private destroyRef = inject(DestroyRef);
    private cdr = inject(ChangeDetectorRef);

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
        this.esgService.getRegistrosESG().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (registros) => {
                this.resumenes = this.esgService.agruparPorMes(registros);
                this.actualizarGrafico();
                this.isLoading = false;
                this.cdr.markForCheck();
            },
            error: (err) => {
                console.error('Error cargando ESG:', err);
                this.isLoading = false;
                this.cdr.markForCheck();
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

    trackByResumen(index: number, item: any): string { return `${item.mes}-${item.anio}`; }

    showRecordModal = false;
    isCalculatingAuto = false;

    openRecordModal() {
        this.showRecordModal = true;
    }

    closeRecordModal() {
        this.showRecordModal = false;
    }

    onRecordSaved() {
        this.showRecordModal = false;
        this.cargarDatos();
    }

    calcularHuellaAutomatica() {
        this.isCalculatingAuto = true;
        this.esgService.calcularHuellaAutomatica().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
                this.isCalculatingAuto = false;
                this.cargarDatos();
            },
            error: (err) => {
                console.error('Error calculando huella auto:', err);
                this.isCalculatingAuto = false;
                this.cdr.markForCheck();
            }
        });
    }
}
