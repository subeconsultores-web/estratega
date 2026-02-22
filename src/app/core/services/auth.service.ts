import { Injectable, inject } from '@angular/core';
import {
    Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
    signOut, authState, User
} from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private auth = inject(Auth);
    private firestore = inject(Firestore);
    private router = inject(Router);

    user$: Observable<User | null> = authState(this.auth);

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

    async getTenantId(): Promise<string | null> {
        const user = this.auth.currentUser;
        if (!user) return null;

        const token = await user.getIdTokenResult();
        return token.claims['tenantId'] as string || null;
    }

    async getUserRole(): Promise<string | null> {
        const user = this.auth.currentUser;
        if (!user) return null;

        const token = await user.getIdTokenResult();
        return token.claims['role'] as string || null;
    }
}
