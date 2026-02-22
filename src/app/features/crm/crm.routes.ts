import { Routes } from '@angular/router';
import { ClientesList } from './clientes-list/clientes-list';
import { ClienteForm } from './cliente-form/cliente-form';
import { ClienteDetalle } from './cliente-detalle/cliente-detalle';
import { PipelineKanban } from './pipeline-kanban/pipeline-kanban';

export const CRM_ROUTES: Routes = [
    { path: '', redirectTo: 'clientes', pathMatch: 'full' },
    { path: 'clientes', component: ClientesList },
    { path: 'clientes/nuevo', component: ClienteForm },
    { path: 'clientes/:id/editar', component: ClienteForm },
    { path: 'clientes/:id', component: ClienteDetalle },
    { path: 'pipeline', component: PipelineKanban }
];
