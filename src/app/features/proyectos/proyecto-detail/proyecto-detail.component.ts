import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LUCIDE_ICONS, LucideIconProvider,  LucideAngularModule, Activity, Building2, ChevronLeft, Clock, Edit2, FolderKanban, List  } from 'lucide-angular';
import { Observable } from 'rxjs';

import { ProyectosService } from '../../../core/services/proyectos.service';
import { Proyecto } from '../../../core/models/proyectos.model';
import { LoadingSkeleton } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { ProyectoFormComponent } from '../proyecto-form/proyecto-form.component';

@Component({
    selector: 'app-proyecto-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule, LoadingSkeleton, ProyectoFormComponent],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Activity, Building2, ChevronLeft, Clock, Edit2, FolderKanban, List }) }
  ],
    templateUrl: './proyecto-detail.component.html'
})
export class ProyectoDetailComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private proyectosService = inject(ProyectosService);
    private location = inject(Location);

    proyectoId!: string;
    proyecto$!: Observable<Proyecto | undefined>;

    // UI States
    showEditModal = false;

    // Navigation tabs config
    tabs = [
        { id: 'kanban', label: 'Tablero Kanban', icon: 'folder-kanban' },
        { id: 'lista', label: 'Lista Tareas', icon: 'list' }
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
}
