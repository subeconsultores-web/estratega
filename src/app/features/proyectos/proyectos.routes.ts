import { Routes } from '@angular/router';
import { ProyectosList } from './proyectos-list/proyectos-list';
import { KanbanBoard } from './kanban-board/kanban-board';
import { ProyectoDetailComponent } from './proyecto-detail/proyecto-detail.component';
import { TareaListComponent } from './tarea-list/tarea-list.component';

export const PROYECTOS_ROUTES: Routes = [
    {
        path: '',
        component: ProyectosList
    },
    {
        path: ':id',
        component: ProyectoDetailComponent,
        children: [
            { path: '', redirectTo: 'kanban', pathMatch: 'full' },
            { path: 'kanban', component: KanbanBoard },
            { path: 'lista', component: TareaListComponent }
        ]
    }
];
