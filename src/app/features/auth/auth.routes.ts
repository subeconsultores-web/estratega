import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./login/login').then(m => m.Login)
    },
    {
        path: 'register',
        loadComponent: () => import('./register-agency/register-agency.component').then(m => m.RegisterAgencyComponent)
    }
];
