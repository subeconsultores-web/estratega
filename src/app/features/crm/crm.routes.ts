import { Routes } from '@angular/router';

export const CRM_ROUTES: Routes = [
    {
        path: '',
        redirectTo: 'clientes',
        pathMatch: 'full'
    },
    {
        path: 'clientes',
        loadComponent: () => import('./clientes-list/clientes-list.component').then(m => m.ClientesListComponent)
    },
    {
        path: 'clientes/nuevo',
        loadComponent: () => import('./cliente-form/cliente-form.component').then(m => m.ClienteFormComponent)
    },
    {
        path: 'clientes/:id/editar',
        loadComponent: () => import('./cliente-form/cliente-form.component').then(m => m.ClienteFormComponent)
    },
    {
        path: 'pipeline',
        loadComponent: () => import('./pipeline-kanban/pipeline-kanban.component').then(m => m.PipelineKanbanComponent)
    }
];
