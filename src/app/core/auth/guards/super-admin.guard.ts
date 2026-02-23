import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import { map, switchMap, take } from 'rxjs/operators';
import { of, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SuperAdminGuard {
    private auth = inject(Auth);
    private router = inject(Router);

    canActivate(): Observable<boolean> {
        if (!environment.production) {
            // Opcional: Permitir bypass en localhost si es necesario, 
            // pero por seguridad lo dejamos validar siempre contra Firebase Auth.
        }

        return user(this.auth).pipe(
            take(1),
            switchMap(currentUser => {
                if (!currentUser) {
                    this.router.navigate(['/auth/login']);
                    return of(false);
                }

                // Refrescar el token forzosamente para asegurarse de obtener claims recientes
                return currentUser.getIdTokenResult(true).then(idTokenResult => {
                    const role = idTokenResult.claims['role'];
                    if (role === 'superadmin') {
                        return true;
                    } else {
                        console.warn('SuperAdminGuard: Access Denied. User does not have superadmin role.');
                        this.router.navigate(['/dashboard']);
                        return false;
                    }
                });
            })
        );
    }
}
