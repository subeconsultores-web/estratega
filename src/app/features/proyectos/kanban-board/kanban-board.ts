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
import { LucideAngularModule } from 'lucide-angular';

import { ProyectosService } from '../../../core/services/proyectos.service';
import { TareasService } from '../../../core/services/tareas.service';
import { TimetrackingService } from '../../../core/services/timetracking.service';
import { Proyecto, Tarea, TareaEstado } from '../../../core/models/proyectos.model';

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
        LucideAngularModule
    ],
    templateUrl: './kanban-board.html',
    providers: [DatePipe]
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

    // The 4 columns mapped visually
    board: KanbanColumn[] = [
        { id: 'todo', title: 'Por Hacer', tasks: [], color: 'bg-gray-100 border-gray-200' },
        { id: 'in_progress', title: 'En Progreso', tasks: [], color: 'bg-blue-50 border-blue-200' },
        { id: 'review', title: 'Revisión', tasks: [], color: 'bg-yellow-50 border-yellow-200' },
        { id: 'done', title: 'Completado', tasks: [], color: 'bg-green-50 border-green-200' }
    ];

    connectedLists = this.board.map(c => c.id);

    ngOnInit() {
        this.proyectoId = this.route.snapshot.paramMap.get('id') || '';
        if (this.proyectoId) {
            this.proyectosSvc.getProyecto(this.proyectoId).subscribe(p => {
                if (p) this.proyecto = p;
            });

            this.tareasSvc.getTareasByProyecto(this.proyectoId).subscribe(tareas => {
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
            const movedTask = event.container.data[event.currentIndex];
            const newEstado = event.container.id as TareaEstado;

            // Background persist
            this.tareasSvc.updateTareaEstado(movedTask.id!, newEstado, event.currentIndex).catch(e => console.error(e));

            // Re-sync order within the targeted array
            this.syncColumnOrder(newEstado, event.container.data);
        }
    }

    private syncColumnOrder(estado: TareaEstado, list: Tarea[]) {
        const payload = list.map((t, idx) => ({ id: t.id!, orden: idx }));
        this.tareasSvc.updateBatchOrder(payload).catch(e => console.error('Kanban Sync Error', e));
    }

    // Quick Task generation Stub
    crearTareaMock(colId: TareaEstado) {
        const title = prompt('Crear Mock - Escribe un título para la tarea:');
        if (title) {
            this.tareasSvc.createTarea({
                proyectoId: this.proyectoId,
                titulo: title,
                estado: colId,
                orden: 0,
                descripcion: 'Revisar detalles adjuntos...'
            });
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
