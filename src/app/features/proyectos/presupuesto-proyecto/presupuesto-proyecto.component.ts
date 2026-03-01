import { Component, inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LUCIDE_ICONS, LucideIconProvider, LucideAngularModule, Plus, Trash2, Edit2, Save, X, DollarSign } from 'lucide-angular';
import { ActivatedRoute } from '@angular/router';
import { map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

import { ProyectosService } from '../../../core/services/proyectos.service';
import { Proyecto, PartidaPresupuestaria } from '../../../core/models/proyectos.model';

@Component({
    selector: 'app-presupuesto-proyecto',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
    providers: [
        { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Plus, Trash2, Edit2, Save, X, DollarSign }) }
    ],
    templateUrl: './presupuesto-proyecto.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PresupuestoProyectoComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private proyectosService = inject(ProyectosService);
    private fb = inject(FormBuilder);
    private cdr = inject(ChangeDetectorRef);

    proyecto!: Proyecto;
    partidas: PartidaPresupuestaria[] = [];

    showForm = false;
    partidaForm!: FormGroup;
    editingId: string | null = null;

    ngOnInit(): void {
        this.initForm();
        this.route.parent?.paramMap.pipe(
            map(params => params.get('id')),
            switchMap(id => id ? this.proyectosService.getProyecto(id) : of(null))
        ).subscribe(proyecto => {
            if (proyecto) {
                this.proyecto = proyecto;
                this.partidas = proyecto.partidas || [];
                this.cdr.detectChanges();
            }
        });
    }

    private initForm(): void {
        this.partidaForm = this.fb.group({
            nombre: ['', Validators.required],
            montoEstimado: [0, [Validators.required, Validators.min(0)]],
            montoEjecutado: [0, [Validators.required, Validators.min(0)]]
        });
    }

    abrirForm(partida?: PartidaPresupuestaria): void {
        this.showForm = true;
        if (partida) {
            this.editingId = partida.id;
            this.partidaForm.patchValue(partida);
        } else {
            this.editingId = null;
            this.partidaForm.reset({ montoEstimado: 0, montoEjecutado: 0 });
        }
    }

    cerrarForm(): void {
        this.showForm = false;
        this.editingId = null;
        this.partidaForm.reset();
    }

    async guardarPartida(): Promise<void> {
        if (this.partidaForm.invalid) return;

        const value = this.partidaForm.value;
        let nuevasPartidas = [...this.partidas];

        if (this.editingId) {
            nuevasPartidas = nuevasPartidas.map(p => p.id === this.editingId ? { ...p, ...value } : p);
        } else {
            nuevasPartidas.push({
                id: crypto.randomUUID(),
                ...value
            });
        }

        this.partidas = nuevasPartidas;
        await this.syncWithProject();
        this.cerrarForm();
    }

    async eliminarPartida(id: string): Promise<void> {
        if (confirm('¿Eliminar esta partida presupuestaria?')) {
            this.partidas = this.partidas.filter(p => p.id !== id);
            await this.syncWithProject();
            this.cdr.detectChanges();
        }
    }

    private async syncWithProject(): Promise<void> {
        const ejecutadoTotal = this.partidas.reduce((sum, p) => sum + p.montoEjecutado, 0);

        try {
            await this.proyectosService.updateProyecto(this.proyecto.id!, {
                partidas: this.partidas,
                presupuestoFinancieroEjecutado: ejecutadoTotal
            } as any);
        } catch (e) {
            console.error('Error updating budget:', e);
        }
    }
}
