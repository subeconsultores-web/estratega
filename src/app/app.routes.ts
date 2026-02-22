import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full'
    },
    {
        path: 'auth',
        loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
    },
    {
        path: 'dashboard',
        canActivate: [authGuard],
        loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
    },
    {
        path: 'crm',
        canActivate: [authGuard],
        loadChildren: () => import('./features/crm/crm.routes').then(m => m.CRM_ROUTES)
    },
    {
        path: 'cotizaciones',
        canActivate: [authGuard],
        loadChildren: () => import('./features/cotizaciones/cotizaciones.routes').then(m => m.COTIZACIONES_ROUTES)
    },
    {
        path: 'finanzas',
        canActivate: [authGuard],
        loadChildren: () => import('./features/finanzas/finanzas.routes').then(m => m.FINANZAS_ROUTES)
    },
    {
        path: 'portal',
        loadChildren: () => import('./features/portal-cliente/portal.routes').then(m => m.PORTAL_ROUTES)
    },
    {
        path: '**',
        redirectTo: '/dashboard'
    }
];
