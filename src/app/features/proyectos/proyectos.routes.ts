import { Routes } from '@angular/router';
import { ProyectosList } from './proyectos-list/proyectos-list';
import { KanbanBoard } from './kanban-board/kanban-board';

export const PROYECTOS_ROUTES: Routes = [
    {
        path: '',
        component: ProyectosList
    },
    {
        path: ':id/kanban',
        component: KanbanBoard
    }
];
