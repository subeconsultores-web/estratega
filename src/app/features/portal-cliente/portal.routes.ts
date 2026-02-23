import { Routes } from '@angular/router';

import { PortalLayoutComponent } from './portal-layout.component';
import { PortalDashboardComponent } from './portal-dashboard/portal-dashboard.component';
import { PortalProyectosComponent } from './portal-proyectos/portal-proyectos.component';
import { PortalFacturacionComponent } from './portal-facturacion/portal-facturacion.component';

export const PORTAL_ROUTES: Routes = [
    {
        path: '',
        component: PortalLayoutComponent,
        children: [
            {
                path: '',
                component: PortalDashboardComponent
            },
            {
                path: 'proyectos',
                component: PortalProyectosComponent
            },
            {
                path: 'facturas',
                component: PortalFacturacionComponent
            },
            {
                path: 'soporte',
                loadComponent: () => import('./portal-soporte/portal-soporte.component').then(m => m.PortalSoporteComponent)
            },
            {
                path: 'documentos',
                loadComponent: () => import('./portal-documentos/portal-documentos.component').then(m => m.PortalDocumentosComponent)
            }
        ]
    }
];
