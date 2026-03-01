import { Routes } from '@angular/router';

export const CONFIG_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./configuracion-layout.component').then(m => m.ConfiguracionLayoutComponent),
        children: [
            {
                path: '',
                redirectTo: 'usuarios',
                pathMatch: 'full'
            },
            {
                path: 'usuarios',
                loadComponent: () => import('./usuarios/usuarios-list/usuarios-list').then(m => m.UsuariosList)
            },
            {
                path: 'api-keys',
                loadComponent: () => import('./api-keys/api-keys.component').then(m => m.ApiKeysComponent)
            },
            {
                path: 'webhooks',
                loadComponent: () => import('./webhooks/webhooks.component').then(m => m.WebhooksComponent)
            },
            {
                path: 'apariencia',
                loadComponent: () => import('./apariencia/apariencia.component').then(m => m.AparienciaComponent)
            }
        ]
    }
];
