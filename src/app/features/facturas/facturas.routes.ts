import { Routes } from '@angular/router';

export const FACTURAS_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./facturas-list/facturas-list.component').then(m => m.FacturasListComponent)
    },
    {
        path: 'new',
        loadComponent: () => import('./factura-form/factura-form.component').then(m => m.FacturaFormComponent)
    },
    {
        path: ':id',
        loadComponent: () => import('./factura-form/factura-form.component').then(m => m.FacturaFormComponent)
    },
    {
        path: ':id/view',
        loadComponent: () => import('./factura-view/factura-view.component').then(m => m.FacturaViewComponent)
    }
];
