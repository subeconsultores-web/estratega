import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LUCIDE_ICONS, LucideIconProvider, LucideAngularModule, X, Save, Loader2, Leaf } from 'lucide-angular';
import { EsgService } from '../../../../core/services/esg.service';
import { RegistroESG } from '../../../../core/models/sostenibilidad.model';

@Component({
    selector: 'app-esg-record-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    providers: [
        { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ X, Save, Loader2, Leaf }) }
    ],
    template: `
        <!-- Overlay -->
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
             (click)="onBackdropClick($event)">

            <!-- Dialog -->
            <div class="bg-surface rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">

                <!-- Header -->
                <div class="px-6 py-5 border-b border-border flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center">
                            <lucide-icon name="leaf" class="w-5 h-5"></lucide-icon>
                        </div>
                        <div>
                            <h2 class="text-lg font-bold text-txt-primary">Registrar Consumo</h2>
                            <p class="text-xs text-txt-muted">Añade datos manuales para el cálculo de huella</p>
                        </div>
                    </div>
                    <button (click)="close.emit()" class="p-2 hover:bg-surface-hover rounded-lg transition-colors">
                        <lucide-icon name="x" class="w-4 h-4 text-txt-muted"></lucide-icon>
                    </button>
                </div>

                <!-- Form -->
                <form (ngSubmit)="guardarRegistro()" class="px-6 py-5 space-y-4">
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-txt-secondary mb-1">Tipo de Recurso</label>
                            <select [(ngModel)]="registro.tipoRecurso" name="tipoRecurso" required (change)="onTipoRecursoChange()"
                                class="w-full px-4 py-2 bg-surface text-txt-primary border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-sm">
                                <option value="electricidad">Electricidad</option>
                                <option value="agua">Agua</option>
                                <option value="combustible">Combustible</option>
                                <option value="vuelos">Vuelos</option>
                                <option value="otro">Otro</option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-txt-secondary mb-1">Unidad de Medida</label>
                            <select [(ngModel)]="registro.unidadMedida" name="unidadMedida" required
                                class="w-full px-4 py-2 bg-surface text-txt-primary border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-sm">
                                <option value="kWh">kWh</option>
                                <option value="m3">m³</option>
                                <option value="litros">Litros</option>
                                <option value="km">Km</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-txt-secondary mb-1">Consumo Bruto</label>
                        <input type="number" [(ngModel)]="registro.consumoBruto" name="consumoBruto" required min="0" step="0.01" (input)="calcularEstimacion()"
                            placeholder="Ej. 1500"
                            class="w-full px-4 py-2 bg-surface text-txt-primary border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-sm">
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-txt-secondary mb-1">Fecha Inicio</label>
                            <input type="date" [(ngModel)]="registro.fechaInicioPeriodo" name="fechaInicioPeriodo" required
                                class="w-full px-4 py-2 bg-surface text-txt-primary border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-sm">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-txt-secondary mb-1">Fecha Fin</label>
                            <input type="date" [(ngModel)]="registro.fechaFinPeriodo" name="fechaFinPeriodo" required
                                class="w-full px-4 py-2 bg-surface text-txt-primary border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-sm">
                        </div>
                    </div>

                    <div class="bg-surface-hover/50 p-4 rounded-lg border border-border mt-4">
                        <p class="text-xs text-txt-muted mb-1">Estimación de Huella (Factor: {{ factorEmision }})</p>
                        <p class="text-lg font-bold text-green-600">{{ estimacionKgCO2 | number:'1.0-2' }} <span class="text-sm">kg CO₂eq</span></p>
                    </div>

                    <!-- Error -->
                    <div *ngIf="errorMessage" class="flex items-start gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                        <p class="text-sm">{{ errorMessage }}</p>
                    </div>

                    <!-- Actions -->
                    <div class="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                        <button type="button" (click)="close.emit()"
                            class="px-4 py-2 text-sm font-medium text-txt-secondary hover:bg-surface-hover rounded-lg transition-colors border border-transparent">
                            Cancelar
                        </button>
                        <button type="submit" [disabled]="isSubmitting || !esValido()"
                            class="inline-flex items-center px-5 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                            <ng-container *ngIf="isSubmitting">
                                <lucide-icon name="loader-2" class="w-4 h-4 mr-2 animate-spin"></lucide-icon>
                                Guardando...
                            </ng-container>
                            <ng-container *ngIf="!isSubmitting">
                                <lucide-icon name="save" class="w-4 h-4 mr-2"></lucide-icon>
                                Guardar Registro
                            </ng-container>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `
})
export class EsgRecordModalComponent {
    private esgService = inject(EsgService);

    @Output() close = new EventEmitter<void>();
    @Output() saved = new EventEmitter<void>();

    registro: Partial<RegistroESG> = {
        tipoRecurso: 'electricidad',
        unidadMedida: 'kWh',
        consumoBruto: 0,
        fechaInicioPeriodo: '',
        fechaFinPeriodo: ''
    };

    isSubmitting = false;
    errorMessage = '';
    factorEmision = 0.28; // Default para electricidad
    estimacionKgCO2 = 0;

    onTipoRecursoChange() {
        switch (this.registro.tipoRecurso) {
            case 'electricidad':
                this.registro.unidadMedida = 'kWh';
                this.factorEmision = 0.28; // Referencia kg CO2eq / kWh
                break;
            case 'agua':
                this.registro.unidadMedida = 'm3';
                this.factorEmision = 0.3; // Referencia kg CO2eq / m3
                break;
            case 'combustible':
                this.registro.unidadMedida = 'litros';
                this.factorEmision = 2.3; // Referencia kg CO2eq / litro bencina
                break;
            case 'vuelos':
                this.registro.unidadMedida = 'km';
                this.factorEmision = 0.15; // Referencia kg CO2eq / km pasajero
                break;
            case 'otro':
                this.factorEmision = 1.0;
                break;
        }
        this.calcularEstimacion();
    }

    calcularEstimacion() {
        if (this.registro.consumoBruto) {
            this.estimacionKgCO2 = this.registro.consumoBruto * this.factorEmision;
        } else {
            this.estimacionKgCO2 = 0;
        }
    }

    esValido(): boolean {
        return !!(this.registro.tipoRecurso && this.registro.unidadMedida && this.registro.consumoBruto && this.registro.fechaInicioPeriodo && this.registro.fechaFinPeriodo);
    }

    async guardarRegistro() {
        if (!this.esValido()) return;

        this.isSubmitting = true;
        this.errorMessage = '';

        try {
            const nuevoRegistro: Partial<RegistroESG> = {
                ...this.registro,
                factorEmisionUtilizado: this.factorEmision,
                huellaCarbonoKgCO2eq: this.estimacionKgCO2,
                procesadoPorAI: false,
                fechaProcesamiento: new Date(),
                // Aseguramos que las fechas se guarden como objetos Date
                fechaInicioPeriodo: new Date(this.registro.fechaInicioPeriodo),
                fechaFinPeriodo: new Date(this.registro.fechaFinPeriodo)
            };

            await this.esgService.addRegistroManual(nuevoRegistro as any);
            this.saved.emit();
        } catch (error: any) {
            console.error('Error guardando registro:', error);
            this.errorMessage = error?.message || 'Error al guardar el registro. Intente nuevamente.';
        } finally {
            this.isSubmitting = false;
        }
    }

    onBackdropClick(event: MouseEvent) {
        if (event.target === event.currentTarget) {
            this.close.emit();
        }
    }
}
