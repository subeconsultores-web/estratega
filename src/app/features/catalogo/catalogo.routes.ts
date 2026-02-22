import { Routes } from '@angular/router';

export default [
    {
        path: '',
        redirectTo: 'lista',
        pathMatch: 'full'
    },
    {
        path: 'lista',
        loadComponent: () => import('./catalogo-list/catalogo-list.component').then(m => m.CatalogoListComponent)
    },
    {
        path: 'nuevo',
        loadComponent: () => import('./catalogo-form/catalogo-form.component').then(m => m.CatalogoFormComponent)
    },
    {
        path: ':id',
        loadComponent: () => import('./catalogo-form/catalogo-form.component').then(m => m.CatalogoFormComponent)
    }
] as Routes;
