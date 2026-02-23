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
            }
        ]
    }
];
