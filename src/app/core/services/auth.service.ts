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

    /** Emite el clienteId del usuario-cliente autenticado (null para staff). */
    clienteId$: Observable<string | null> = this.user$.pipe(
        filter((user): user is User => !!user),
        switchMap(user => defer(() => from(this.resolveClienteId(user)))),
        shareReplay(1)
    );

    async login(email: string, password: string) {
        try {
            const credential = await signInWithEmailAndPassword(this.auth, email, password);
            // Route clients to portal, staff to dashboard
            const token = await credential.user.getIdTokenResult();
            const role = token.claims['role'] as string;
            this.router.navigate([role === 'client' ? '/portal' : '/dashboard']);
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
        try {
            return await firstValueFrom(this.tenantId$);
        } catch {
            return null;
        }
    }

    /**
     * Intenta obtener tenantId de 2 fuentes en orden:
     * 1. Token JWT (cached)
     * 2. Firestore users/{uid} (fallback real-time compatible)
     */
    private async resolveTenantId(user: User): Promise<string | null> {
        try {
            // 1. Intento rápido: token cacheado
            const token = await user.getIdTokenResult();
            if (token.claims['tenantId']) {
                return token.claims['tenantId'] as string;
            }

            // 2. Fallback: leer desde Firestore usando docData (real-time compatible)
            const userDocRef = doc(this.firestore, 'users', user.uid);
            const userData = await firstValueFrom(
                docData(userDocRef).pipe(map(data => data?.['tenantId'] as string | undefined))
            );
            if (userData) {
                return userData;
            }

            // 3. Fallback final: usar UID como tenant personal
            return user.uid;
        } catch (e) {
            console.error('[AuthService] Error resolviendo tenantId', e);
            return user.uid;
        }
    }

    /**
     * Resuelve clienteId desde JWT claims o Firestore.
     * Retorna null para usuarios staff (no-client).
     */
    private async resolveClienteId(user: User): Promise<string | null> {
        try {
            const token = await user.getIdTokenResult();
            if (token.claims['clienteId']) {
                return token.claims['clienteId'] as string;
            }

            // Fallback: Firestore
            const userDocRef = doc(this.firestore, 'users', user.uid);
            const clienteId = await firstValueFrom(
                docData(userDocRef).pipe(map(data => data?.['clienteId'] as string | undefined))
            );
            return clienteId || null;
        } catch (e) {
            console.error('[AuthService] Error resolviendo clienteId', e);
            return null;
        }
    }

    /** Obtiene el clienteId del usuario actual (sync-await). */
    async getClienteId(): Promise<string | null> {
        try {
            return await firstValueFrom(this.clienteId$);
        } catch {
            return null;
        }
    }

    /** Verifica si el usuario actual es un cliente del portal. */
    async isClient(): Promise<boolean> {
        return await this.hasRole('client');
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
        // Fallback by email + JWT role claim
        if (user.email === 'bruno@subeia.tech') return true;
        return await this.hasRole('super_admin');
    }
}
