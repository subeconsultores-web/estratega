import { Routes } from '@angular/router';
import { CotizacionesListComponent } from './cotizaciones-list/cotizaciones-list';
import { CotizacionFormComponent } from './cotizacion-form/cotizacion-form';
import { CotizacionDetalleComponent } from './cotizacion-detalle/cotizacion-detalle';

export const COTIZACIONES_ROUTES: Routes = [
    {
        path: '',
        component: CotizacionesListComponent
    },
    {
        path: 'nuevo',
        component: CotizacionFormComponent
    },
    {
        path: 'editar/:id',
        component: CotizacionFormComponent
    },
    {
        path: ':id',
        component: CotizacionDetalleComponent
    }
];
