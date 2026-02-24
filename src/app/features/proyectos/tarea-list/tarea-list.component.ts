import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { LUCIDE_ICONS, LucideIconProvider,  LucideAngularModule, ClipboardList, Plus  } from 'lucide-angular';

import { TareasService } from '../../../core/services/tareas.service';
import { Tarea } from '../../../core/models/proyectos.model';
import { DataTableComponent, ColumnDef } from '../../../shared/components/data-table/data-table.component';
import { LoadingSkeleton } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { TareaFormComponent } from '../tarea-form/tarea-form.component';

@Component({
    selector: 'app-tarea-list',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, DataTableComponent, LoadingSkeleton, TareaFormComponent],
    templateUrl: './tarea-list.component.html',
    providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ ClipboardList, Plus }) },DatePipe]
})
export class TareaListComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private tareasSvc = inject(TareasService);

    proyectoId!: string;
    tareas$!: Observable<Tarea[]>;

    // Modal State
    showTareaModal = false;
    tareaEnEdicion?: Tarea;

    columns: ColumnDef[] = [
        { key: 'titulo', label: 'Título de la Tarea' },
        { key: 'estado', label: 'Estado', type: 'badge' },
        { key: 'tiempoEstimado', label: 'Est. Horas' },
        { key: 'tiempoConsumido', label: 'Consumidas' }
    ];

    ngOnInit(): void {
        this.proyectoId = this.route.parent?.snapshot.paramMap.get('id') || this.route.snapshot.paramMap.get('id') || '';
        if (this.proyectoId) {
            this.tareas$ = this.tareasSvc.getTareasByProyecto(this.proyectoId);
        }
    }

    onActionClick(event: { item: any, action: string }) {
        if (event.action === 'view' || event.action === 'edit') {
            this.abrirModalEditarTarea(event.item as Tarea);
        }
    }

    // Modal Handling
    abrirModalNuevaTarea() {
        this.tareaEnEdicion = undefined;
        this.showTareaModal = true;
    }

    abrirModalEditarTarea(tarea: Tarea) {
        this.tareaEnEdicion = tarea;
        this.showTareaModal = true;
    }

    cerrarModalTarea() {
        this.showTareaModal = false;
        this.tareaEnEdicion = undefined;
    }

    async guardarTarea(data: Partial<Tarea>) {
        this.showTareaModal = false;
        try {
            if (this.tareaEnEdicion && this.tareaEnEdicion.id) {
                await this.tareasSvc.updateTarea(this.tareaEnEdicion.id, data);
            } else {
                await this.tareasSvc.createTarea({
                    ...data,
                    proyectoId: this.proyectoId,
                    orden: 0
                } as Tarea);
            }
        } catch (e) {
            console.error('Error guardando tarea desde la lista', e);
        } finally {
            this.tareaEnEdicion = undefined;
        }
    }
}
