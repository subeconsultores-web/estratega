import { Routes } from '@angular/router';

export const FINANZAS_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./dashboard-financiero/dashboard-financiero.component').then(c => c.DashboardFinancieroComponent),
        title: 'SUBE IA - Dashboard Financiero'
    },
    {
        path: 'transacciones',
        loadComponent: () => import('./transacciones-list/transacciones-list').then(c => c.TransaccionesList),
        title: 'SUBE IA - Transacciones'
    },
    {
        path: 'transacciones/nueva',
        loadComponent: () => import('./transaccion-form/transaccion-form').then(c => c.TransaccionForm),
        title: 'SUBE IA - Nueva Transacción'
    },
    {
        path: 'transacciones/editar/:id',
        loadComponent: () => import('./transaccion-form/transaccion-form').then(c => c.TransaccionForm),
        title: 'SUBE IA - Editar Transacción'
    }
];
