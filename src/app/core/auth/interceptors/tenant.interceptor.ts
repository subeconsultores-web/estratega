import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { from, switchMap, catchError, throwError } from 'rxjs';

/**
 * TenantInterceptor (Angular 19+)
 * Intercepta peticiones HTTP salientes e inyecta el `X-Tenant-ID` si el usuario está autenticado.
 * Crucial para futuras integraciones con Cloud Functions Gen 2 o APIs externas que dependan de este header.
 */
export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);

    return from(authService.getTenantId()).pipe(
        switchMap(tenantId => {
            if (tenantId) {
                const clonedRequest = req.clone({
                    setHeaders: {
                        'X-Tenant-ID': tenantId
                    }
                });
                return next(clonedRequest);
            }
            // Si no hay tenantId (ej: no logueado), pasa la petición original
            return next(req);
        }),
        catchError(error => {
            console.error('Error en TenantInterceptor:', error);
            return throwError(() => error);
        })
    );
};
