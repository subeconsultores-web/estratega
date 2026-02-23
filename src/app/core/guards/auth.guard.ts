import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { map, take, switchMap } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
    const auth = inject(Auth);
    const router = inject(Router);

    return authState(auth).pipe(
        take(1),
        switchMap(async (user) => {
            if (!user) {
                router.navigate(['/auth/login']);
                return false;
            }

            // Check claims for RBAC routing
            const token = await user.getIdTokenResult();
            const role = token.claims['role'] as string;

            // If user is a client trying to access standard layout (like /dashboard), divert them
            if (role === 'client' && !state.url.startsWith('/portal')) {
                router.navigate(['/portal']);
                return false;
            }

            // If user is an admin/agency trying to access /portal, divert them back
            if (role !== 'client' && state.url.startsWith('/portal')) {
                router.navigate(['/dashboard']);
                return false;
            }

            return true;
        })
    );
};
