import { Routes } from '@angular/router';

export const MENSAJERIA_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./chat-inbox/chat-inbox.component').then(m => m.ChatInboxComponent)
    }
];
