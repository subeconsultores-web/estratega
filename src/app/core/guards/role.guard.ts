import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { switchMap, take } from 'rxjs/operators';
import { of, from } from 'rxjs';

export const roleGuard: CanActivateFn = (route, state) => {
    const auth = inject(Auth);
    const router = inject(Router);
    const requiredRoles = route.data['roles'] as string[];

    return authState(auth).pipe(
        take(1),
        switchMap(user => {
            if (!user) {
                router.navigate(['/auth/login']);
                return of(false);
            }

            return from(user.getIdTokenResult().then(token => {
                const userRole = token.claims['role'] as string;
                if (requiredRoles.includes(userRole)) {
                    return true;
                } else {
                    router.navigate(['/unauthorized']);
                    return false;
                }
            }));
        })
    );
};
