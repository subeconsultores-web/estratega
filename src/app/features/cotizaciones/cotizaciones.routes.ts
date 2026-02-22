import { Routes } from '@angular/router';

export default [
    {
        path: '',
        redirectTo: 'lista',
        pathMatch: 'full'
    },
    {
        path: 'lista',
        loadComponent: () => import('./cotizaciones-list/cotizaciones-list.component').then(m => m.CotizacionesListComponent)
    },
    {
        path: 'nueva',
        loadComponent: () => import('./cotizacion-form/cotizacion-form.component').then(m => m.CotizacionFormComponent)
    },
    {
        path: ':id',
        children: [
            {
                path: '',
                redirectTo: 'editar',
                pathMatch: 'full'
            },
            {
                path: 'editar', // Admin/Seller Edit Mode
                loadComponent: () => import('./cotizacion-form/cotizacion-form.component').then(m => m.CotizacionFormComponent)
            },
            {
                path: 'ver', // Resumen general
                loadComponent: () => import('./cotizacion-view/cotizacion-view.component').then(m => m.CotizacionViewComponent)
            }
        ]
    }
] as Routes;
