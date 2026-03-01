import { Component, inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LUCIDE_ICONS, LucideIconProvider, LucideAngularModule, Activity, Building2, ChevronLeft, Clock, Edit2, FolderKanban, List, Sparkles, Loader2, Users, DollarSign } from 'lucide-angular';
import { Observable } from 'rxjs';
import { Functions, httpsCallable } from '@angular/fire/functions';

import { ProyectosService } from '../../../core/services/proyectos.service';
import { Proyecto } from '../../../core/models/proyectos.model';
import { LoadingSkeleton } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { ProyectoFormComponent } from '../proyecto-form/proyecto-form.component';
import { BurnRateDashboardComponent } from '../burn-rate-dashboard/burn-rate-dashboard.component';

@Component({
    selector: 'app-proyecto-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, LucideAngularModule, LoadingSkeleton, ProyectoFormComponent, BurnRateDashboardComponent],
    providers: [
        { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Activity, Building2, ChevronLeft, Clock, Edit2, FolderKanban, List, Sparkles, Loader2, Users, DollarSign }) }
    ],
    templateUrl: './proyecto-detail.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProyectoDetailComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private proyectosService = inject(ProyectosService);
    private location = inject(Location);
    private functions = inject(Functions);
    private cdr = inject(ChangeDetectorRef);

    proyectoId!: string;
    proyecto$!: Observable<Proyecto | undefined>;

    // UI States
    showEditModal = false;

    // Smart Capacity Planning
    isLoadingEquipo = false;
    equipoSugerido: any[] = [];
    equipoMensaje = '';
    showEquipoPanel = false;
    skillsInput = '';

    // Navigation tabs config
    tabs = [
        { id: 'kanban', label: 'Tablero Kanban', icon: 'folder-kanban' },
        { id: 'lista', label: 'Lista Tareas', icon: 'list' },
        { id: 'presupuesto', label: 'Presupuesto', icon: 'dollar-sign' },
        { id: 'tiempos', label: 'Time Tracking', icon: 'clock' }
    ];

    get currentPath(): string {
        return this.router.url.split('/').pop() || 'kanban';
    }

    ngOnInit(): void {
        this.proyectoId = this.route.snapshot.paramMap.get('id') || '';
        if (this.proyectoId) {
            this.proyecto$ = this.proyectosService.getProyecto(this.proyectoId);
        }
    }

    goBack(): void {
        this.router.navigate(['/proyectos']);
    }

    abrirEditarProyecto(): void {
        this.showEditModal = true;
    }

    cerrarEditarProyecto(): void {
        this.showEditModal = false;
    }

    async guardarCambiosProyecto(changes: Partial<Proyecto>) {
        this.showEditModal = false;
        try {
            await this.proyectosService.updateProyecto(this.proyectoId, changes as any);
        } catch (e) {
            console.error('Error actualizando proyecto', e);
        }
    }

    porcentajeConsumo(consumidas = 0, presupuesto = 0): number {
        if (!presupuesto) return 0;
        return Math.min(Math.round((consumidas / presupuesto) * 100), 100);
    }

    porcentajeConsumoFinanciero(ejecutado = 0, estimado = 0): number {
        if (!estimado) return 0;
        return Math.min(Math.round((ejecutado / estimado) * 100), 100);
    }

    toggleEquipoPanel() {
        this.showEquipoPanel = !this.showEquipoPanel;
    }

    async autocompletarEquipo() {
        if (!this.skillsInput.trim()) return;

        const skillsRequeridos = this.skillsInput.split(',').map(s => s.trim()).filter(s => s);
        if (skillsRequeridos.length === 0) return;

        this.isLoadingEquipo = true;
        this.equipoSugerido = [];
        this.equipoMensaje = '';

        try {
            const callFn = httpsCallable(this.functions, 'autocompletarEquipo');
            const result = await callFn({ proyectoId: this.proyectoId, skillsRequeridos });
            const payload: any = result.data;
            if (payload?.success) {
                this.equipoSugerido = payload.data.equipo || [];
                this.equipoMensaje = payload.data.mensaje || '';
            }
        } catch (error) {
            console.error('Error autocompletando equipo:', error);
            this.equipoMensaje = 'Error al consultar el motor IA.';
        } finally {
            this.isLoadingEquipo = false;
            this.cdr.detectChanges();
        }
    }
}
