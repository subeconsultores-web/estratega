import { Routes } from '@angular/router';

export const FINANZAS_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./dashboard-financiero/dashboard-financiero.component').then(c => c.DashboardFinancieroComponent),
        title: 'SUBE IA - Dashboard Financiero'
    },
    {
        path: 'transacciones',
        loadComponent: () => import('./finanzas-list/finanzas-list.component').then(c => c.FinanzasListComponent),
        title: 'SUBE IA - Finanzas y Cobros'
    }
];
