import { Routes } from '@angular/router';
import { ConfiguracionLayoutComponent } from './configuracion-layout.component';
import { ApiKeysComponent } from './api-keys/api-keys.component';
import { WebhooksComponent } from './webhooks/webhooks.component';

export const CONFIG_ROUTES: Routes = [
    {
        path: '',
        component: ConfiguracionLayoutComponent,
        children: [
            {
                path: '',
                redirectTo: 'api-keys',
                pathMatch: 'full'
            },
            {
                path: 'api-keys',
                component: ApiKeysComponent
            },
            {
                path: 'webhooks',
                component: WebhooksComponent
            }
        ]
    }
];
