import { Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LUCIDE_ICONS, LucideIconProvider, LucideAngularModule, AlertTriangle, TrendingUp, TrendingDown, Clock, CheckCircle } from 'lucide-angular';
import { Proyecto } from '../../../core/models/proyectos.model';

@Component({
    selector: 'app-burn-rate-dashboard',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    providers: [
        { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ AlertTriangle, TrendingUp, TrendingDown, Clock, CheckCircle }) }
    ],
    templateUrl: './burn-rate-dashboard.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BurnRateDashboardComponent implements OnChanges {
    @Input() proyecto: Proyecto | null = null;

    // KPI Metrics
    horasEstimadas = 0;
    horasInvertidas = 0;
    porcentajeConsumo = 0;
    progresoTecnico = 0;
    burnRateRatio = 0;

    // Status flags
    estaEnPeligro = false;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['proyecto'] && this.proyecto) {
            this.calculateMetrics();
        }
    }

    private calculateMetrics() {
        this.horasEstimadas = this.proyecto?.horasEstimadas || 0;
        this.horasInvertidas = this.proyecto?.horasInvertidas || 0;
        this.progresoTecnico = this.proyecto?.progresoGlobal || 0;

        if (this.horasEstimadas > 0) {
            this.porcentajeConsumo = (this.horasInvertidas / this.horasEstimadas) * 100;
        } else {
            this.porcentajeConsumo = 0;
        }

        // Burn-Rate Ratio: Si gasté el 80% del tiempo pero el avance técnico es 40% (Ratio: 2.0 -> Peligro).
        // Idealmente Ratio ~ 1.0
        if (this.progresoTecnico > 0) {
            this.burnRateRatio = this.porcentajeConsumo / this.progresoTecnico;
        } else if (this.porcentajeConsumo > 0) {
            // Gasté tiempo y progreso es 0 -> Ratio muy alto
            this.burnRateRatio = this.porcentajeConsumo;
        } else {
            this.burnRateRatio = 1;
        }

        // Alerta Peligro: Si he consumido más de un 20% _extra_ comparado al progreso técnico real
        this.estaEnPeligro = this.burnRateRatio > 1.2 && this.porcentajeConsumo > 50;
    }
}
