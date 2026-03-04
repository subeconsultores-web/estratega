import { Routes } from '@angular/router';
import { SuperAdminLayoutComponent } from './superadmin-layout.component';
import { SuperAdminDashboardComponent } from './superadmin-dashboard/superadmin-dashboard.component';
import { SuperAdminGuard } from '../../core/auth/guards/super-admin.guard';

export const SUPERADMIN_ROUTES: Routes = [
    {
        path: '',
        component: SuperAdminLayoutComponent,
        canActivate: [SuperAdminGuard],
        children: [
            {
                path: '',
                redirectTo: 'overview',
                pathMatch: 'full'
            },
            {
                path: 'overview',
                component: SuperAdminDashboardComponent
            },
            {
                path: 'audit-ledger',
                loadComponent: () => import('./audit-ledger/audit-ledger.component').then(m => m.AuditLedgerComponent)
            },
            {
                path: 'cms-config',
                loadComponent: () => import('./landing-cms/landing-config/landing-config').then(m => m.LandingConfigComponent)
            },
            {
                path: 'cms-team',
                loadComponent: () => import('./landing-cms/team-manager/team-manager').then(m => m.TeamManagerComponent)
            },
            {
                path: 'cms-blog',
                loadComponent: () => import('./landing-cms/blog-manager/blog-manager').then(m => m.BlogManagerComponent)
            }
        ]
    }
];
