import { Routes } from '@angular/router';

export const PROYECTOS_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./proyectos-list/proyectos-list').then(m => m.ProyectosList)
    },
    {
        path: ':id',
        loadComponent: () => import('./proyecto-detail/proyecto-detail.component').then(m => m.ProyectoDetailComponent),
        children: [
            { path: '', redirectTo: 'kanban', pathMatch: 'full' },
            { path: 'kanban', loadComponent: () => import('./kanban-board/kanban-board').then(m => m.KanbanBoard) },
            { path: 'lista', loadComponent: () => import('./tarea-list/tarea-list.component').then(m => m.TareaListComponent) },
            { path: 'presupuesto', loadComponent: () => import('./presupuesto-proyecto/presupuesto-proyecto.component').then(m => m.PresupuestoProyectoComponent) },
            { path: 'tiempos', loadComponent: () => import('./time-tracking/time-tracking.component').then(m => m.TimeTrackingComponent) }
        ]
    }
];
