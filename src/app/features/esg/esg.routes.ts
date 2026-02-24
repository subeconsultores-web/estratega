import { Routes } from '@angular/router';

export const ESG_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./esg-dashboard.component').then(m => m.EsgDashboardComponent),
        data: { title: 'Dashboard ESG' }
    }
];
