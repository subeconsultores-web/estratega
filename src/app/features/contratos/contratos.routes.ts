import { Routes } from '@angular/router';
import { ContratosListComponent } from './contratos-list/contratos-list.component';
import { ContratoFormComponent } from './contrato-form/contrato-form.component';
import { ContratoViewComponent } from './contrato-view/contrato-view.component';

export default [
    {
        path: '',
        component: ContratosListComponent
    },
    {
        path: 'new',
        component: ContratoFormComponent
    },
    {
        path: ':id',
        component: ContratoFormComponent
    },
    {
        path: ':id/view',
        component: ContratoViewComponent
    }
] as Routes;
