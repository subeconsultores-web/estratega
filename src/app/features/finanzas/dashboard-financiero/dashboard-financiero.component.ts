import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanzasService } from '../../../core/services/finanzas.service';
import { MetricasFinancieras } from '../../../core/models/finanzas.model';
import { RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

@Component({
    selector: 'app-dashboard-financiero',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule],
    templateUrl: './dashboard-financiero.component.html'
})
export class DashboardFinancieroComponent implements OnInit {
    private finanzasService = inject(FinanzasService);

    metricas: MetricasFinancieras | null = null;
    isLoading = true;

    ngOnInit(): void {
        this.cargarMetricas();
    }

    async cargarMetricas() {
        this.isLoading = true;
        try {
            this.metricas = await this.finanzasService.getMetricasResumen();
        } catch (e) {
            console.error('Error al cargar metricas financieras:', e);
        } finally {
            this.isLoading = false;
        }
    }
}
