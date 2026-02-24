import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LayoutComponent } from './core/layout/layout.component';

export const routes: Routes = [
    {
        path: 'validate-signature/:hash',
        loadComponent: () => import('./features/esg/sostenibilidad-validator/sostenibilidad-validator')
            .then(c => c.SostenibilidadValidatorComponent)
    },
    {
        path: 'auth',
        loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
    },
    {
        path: 'superadmin',
        loadChildren: () => import('./features/superadmin/superadmin.routes').then(m => m.SUPERADMIN_ROUTES)
    },
    {
        path: 'portal',
        canActivate: [authGuard],
        loadChildren: () => import('./features/portal-cliente/portal.routes').then(m => m.PORTAL_ROUTES)
    },
    {
        path: '',
        component: LayoutComponent,
        canActivate: [authGuard],
        children: [
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            },
            {
                path: 'dashboard',
                loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
            },
            {
                path: 'crm',
                loadChildren: () => import('./features/crm/crm.routes').then(m => m.CRM_ROUTES)
            },
            {
                path: 'catalogo',
                loadChildren: () => import('./features/catalogo/catalogo.routes')
            },
            {
                path: 'cotizaciones',
                loadChildren: () => import('./features/cotizaciones/cotizaciones.routes')
            },
            {
                path: 'contratos',
                loadChildren: () => import('./features/contratos/contratos.routes')
            },
            {
                path: 'facturas',
                canActivate: [authGuard],
                loadChildren: () => import('./features/facturas/facturas.routes').then(m => m.FACTURAS_ROUTES)
            },
            {
                path: 'finanzas',
                loadChildren: () => import('./features/finanzas/finanzas.routes').then(m => m.FINANZAS_ROUTES)
            },
            {
                path: 'proyectos',
                loadChildren: () => import('./features/proyectos/proyectos.routes').then(m => m.PROYECTOS_ROUTES)
            },
            {
                path: 'configuracion',
                canActivate: [authGuard],
                loadChildren: () => import('./features/configuracion/configuracion.routes').then(m => m.CONFIG_ROUTES)
            },
            {
                path: 'esg',
                canActivate: [authGuard],
                loadChildren: () => import('./features/esg/esg.routes').then(m => m.ESG_ROUTES)
            }
        ]
    },
    {
        path: '**',
        redirectTo: ''
    }
];
