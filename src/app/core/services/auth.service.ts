import { Injectable, inject } from '@angular/core';
import {
    Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
    signOut, authState, User
} from '@angular/fire/auth';
import { Firestore, doc, setDoc, docData } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Observable, from, defer, firstValueFrom } from 'rxjs';
import { filter, switchMap, shareReplay, map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private auth = inject(Auth);
    private firestore = inject(Firestore);
    private router = inject(Router);

    user$: Observable<User | null> = authState(this.auth);

    /** Emite el tenantId del usuario autenticado. Usa JWT claim primero, Firestore como fallback. */
    tenantId$: Observable<string> = this.user$.pipe(
        filter((user): user is User => !!user),
        switchMap(user => defer(() => from(this.resolveTenantId(user)))),
        filter((tid): tid is string => !!tid),
        shareReplay(1)
    );

    async login(email: string, password: string) {
        try {
            const credential = await signInWithEmailAndPassword(this.auth, email, password);
            this.router.navigate(['/dashboard']);
            return credential.user;
        } catch (error) {
            throw error;
        }
    }

    async register(registroData: any) {
        try {
            // 1. Guardar datos de registro temporalmente
            const tempRef = doc(this.firestore, '_registros_temp', registroData.email);
            await setDoc(tempRef, registroData);

            // 2. Crear usuario en Auth (esto dispara onUserCreated Function)
            const credential = await createUserWithEmailAndPassword(
                this.auth,
                registroData.email,
                registroData.password
            );

            return credential.user;
        } catch (error) {
            throw error;
        }
    }

    async logout() {
        await signOut(this.auth);
        this.router.navigate(['/auth/login']);
    }

    async getCurrentUser(): Promise<User | null> {
        await this.auth.authStateReady();
        return this.auth.currentUser;
    }

    async getTenantId(): Promise<string | null> {
        const user = await this.getCurrentUser();
        if (!user) return null;
        return this.resolveTenantId(user);
    }

    /**
     * Intenta obtener tenantId de 3 fuentes en orden:
     * 1. Token JWT (cached)
     * 2. Token JWT (force refresh)
     * 3. Firestore users/{uid} (fallback infalible)
     */
    private async resolveTenantId(user: User): Promise<string | null> {
        try {
            // 1. Intento rápido: token cacheado
            let token = await user.getIdTokenResult();
            if (token.claims['tenantId']) {
                return token.claims['tenantId'] as string;
            }

            // 2. Force refresh del token
            token = await user.getIdTokenResult(true);
            if (token.claims['tenantId']) {
                return token.claims['tenantId'] as string;
            }

            // 3. Fallback: leer desde Firestore usando docData (real-time compatible)
            // NOTA: Usamos docData + firstValueFrom en vez de getDoc para evitar
            // conflicto entre one-shot reads y real-time listeners en @angular/fire.
            console.warn('AuthService: tenantId no encontrado en JWT, leyendo desde Firestore users/' + user.uid);
            const userDocRef = doc(this.firestore, 'users', user.uid);
            const userData = await firstValueFrom(
                docData(userDocRef).pipe(map(data => data?.['tenantId'] as string | undefined))
            );
            if (userData) {
                return userData;
            }

            // 4. Fallback final: usar UID como tenant personal
            console.warn('AuthService: No se encontró tenantId para uid=' + user.uid + '. Usando UID como Tenant Personal.');
            return user.uid;
        } catch (e) {
            console.warn('Error resolviendo tenantId', e);
            return user.uid;
        }
    }

    async getUserRole(): Promise<string | null> {
        const user = await this.getCurrentUser();
        if (!user) return null;

        const token = await user.getIdTokenResult();
        return token.claims['role'] as string || null;
    }

    async hasRole(role: string): Promise<boolean> {
        const currentRole = await this.getUserRole();
        return currentRole === role;
    }

    async isTenantAdmin(): Promise<boolean> {
        return await this.hasRole('tenant_admin');
    }

    async isSuperAdmin(): Promise<boolean> {
        const user = await this.getCurrentUser();
        if (!user) return false;
        // Check by email (hardcoded super admin) or by JWT role claim
        if (user.email === 'bruno@subeia.tech') return true;
        return await this.hasRole('super_admin');
    }
}
