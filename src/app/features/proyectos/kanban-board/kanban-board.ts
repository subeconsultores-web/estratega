import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
    DragDropModule,
    CdkDragDrop,
    CdkDropList,
    CdkDropListGroup,
    CdkDrag,
    moveItemInArray,
    transferArrayItem
} from '@angular/cdk/drag-drop';
import { LUCIDE_ICONS, LucideIconProvider,  LucideAngularModule, ArrowLeft, Clock, Edit2, FolderKanban, MoreHorizontal, Pause, Play, Plus  } from 'lucide-angular';
import { TareasService } from '../../../core/services/tareas.service';

import { ProyectosService } from '../../../core/services/proyectos.service';
import { TimetrackingService } from '../../../core/services/timetracking.service';
import { Proyecto, Tarea, TareaEstado } from '../../../core/models/proyectos.model';
import { TareaFormComponent } from '../tarea-form/tarea-form.component';

interface KanbanColumn {
    id: TareaEstado;
    title: string;
    tasks: Tarea[];
    color: string;
}

@Component({
    selector: 'app-kanban-board',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        DragDropModule,
        CdkDropList,
        CdkDropListGroup,
        CdkDrag,
        LucideAngularModule,
        TareaFormComponent
    ],
    templateUrl: './kanban-board.html',
    providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ ArrowLeft, Clock, Edit2, FolderKanban, MoreHorizontal, Pause, Play, Plus }) },DatePipe]
})
export class KanbanBoard implements OnInit {
    private route = inject(ActivatedRoute);
    private proyectosSvc = inject(ProyectosService);
    private tareasSvc = inject(TareasService);
    public timetrackingSvc = inject(TimetrackingService);

    proyecto!: Proyecto;
    proyectoId!: string;
    // Timer observables for auto UI detection
    activeTracker$ = this.timetrackingSvc.activeSession$;
    currentElapsed$ = this.timetrackingSvc.currentElapsed$;

    // Modal States
    showTareaModal = false;
    columnaSeleccionada: TareaEstado = 'todo';
    tareaEnEdicion?: Tarea;

    // The 4 columns mapped visually
    board: KanbanColumn[] = [
        { id: 'todo', title: 'Por Hacer', tasks: [], color: 'bg-gray-100 border-gray-200' },
        { id: 'in_progress', title: 'En Progreso', tasks: [], color: 'bg-blue-50 border-blue-200' },
        { id: 'review', title: 'Revisión', tasks: [], color: 'bg-yellow-50 border-yellow-200' },
        { id: 'done', title: 'Completado', tasks: [], color: 'bg-green-50 border-green-200' }
    ];

    connectedLists = this.board.map(c => c.id);

    ngOnInit() {
        // Soporta la modalidad anidada (children route) o standalone
        this.proyectoId = this.route.parent?.snapshot.paramMap.get('id') || this.route.snapshot.paramMap.get('id') || '';
        if (this.proyectoId) {
            this.proyectosSvc.getProyecto(this.proyectoId).subscribe((p: any) => {
                if (p) this.proyecto = p;
            });

            this.tareasSvc.getTareasByProyecto(this.proyectoId).subscribe((tareas: any) => {
                this.distributeTasks(tareas);
            });
        }
    }

    private distributeTasks(tareas: Tarea[]) {
        // Clear visually without breaking array references entirely
        this.board.forEach(col => col.tasks = []);

        // Sort items by their saved `orden` mapping
        const sorted = [...tareas].sort((a, b) => (a.orden || 0) - (b.orden || 0));

        sorted.forEach(t => {
            const col = this.board.find(c => c.id === t.estado);
            if (col) {
                col.tasks.push(t);
            }
        });
    }

    drop(event: CdkDragDrop<Tarea[]>) {
        if (event.previousContainer === event.container) {
            // Moved within the SAME column
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);

            // Background array sync logic
            this.syncColumnOrder(event.container.id as TareaEstado, event.container.data);
        } else {
            // Moved to DIFFERENT column
            transferArrayItem(
                event.previousContainer.data,
                event.container.data,
                event.previousIndex,
                event.currentIndex
            );

            // Determine what was moved
            const movedTask = event.container.data[event.currentIndex] as any;
            const newEstado = event.container.id as TareaEstado;

            // Background persist
            this.tareasSvc.updateTareaEstado(movedTask.id!, newEstado, event.currentIndex).catch((e: any) => console.error(e));

            // Re-sync order within the targeted array
            this.syncColumnOrder(newEstado, event.container.data);
        }
    }

    private syncColumnOrder(estado: TareaEstado, list: Tarea[]) {
        const payload = list.map((t, idx) => ({ id: t.id!, orden: idx }));
        this.tareasSvc.updateBatchOrder(payload).catch((e: any) => console.error('Kanban Sync Error', e));
    }

    // Modal y Tareas Reales
    abrirModalNuevaTarea(colId: TareaEstado) {
        this.columnaSeleccionada = colId;
        this.tareaEnEdicion = undefined;
        this.showTareaModal = true;
    }

    abrirModalEditarTarea(tarea: Tarea) {
        this.tareaEnEdicion = tarea;
        this.columnaSeleccionada = tarea.estado;
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
            console.error('Error guardando tarea', e);
        } finally {
            this.tareaEnEdicion = undefined;
        }
    }

    // Time tracking delegates
    iniciarTracker(tarea: Tarea) {
        this.timetrackingSvc.startTracking(tarea);
    }
    pausarTracker() {
        this.timetrackingSvc.pauseTracking();
    }
    resumirTracker() {
        this.timetrackingSvc.resumeTracking();
    }
    detenerTracker() {
        this.timetrackingSvc.stopTracking();
    }

    formatearSegundos(segs: number): string {
        const h = Math.floor(segs / 3600);
        const m = Math.floor((segs % 3600) / 60);
        const s = segs % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
}
