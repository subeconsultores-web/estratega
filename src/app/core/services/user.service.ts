import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, setDoc, updateDoc, deleteDoc, getDocs, query, where } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Observable, from, map, switchMap } from 'rxjs';
import { UserData } from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private firestore = inject(Firestore);
    private authService = inject(AuthService);

    /**
     * Obtiene todos los usuarios pertenecientes al tenant actual.
     */
    getUsersByTenant(): Observable<UserData[]> {
        return from(this.authService.getTenantId()).pipe(
            switchMap(tenantId => {
                if (!tenantId) {
                    throw new Error('No tenantId found in current user claims');
                }
                const usersRef = collection(this.firestore, 'users');
                const q = query(usersRef, where('tenantId', '==', tenantId));
                return from(getDocs(q)).pipe(
                    map(snapshot => snapshot.docs.map(doc => doc.data() as UserData))
                );
            })
        );
    }

    /**
     * Crea un nuevo doc de usuario (la creación en Firebase Auth requiere Cloud Function adicional o Admin SDK).
     * Aquí solo se crea la pre-reserva del documento.
     */
    async createUserDoc(uid: string, userData: Partial<UserData>): Promise<void> {
        const tenantId = await this.authService.getTenantId();
        if (!tenantId) throw new Error('No tenantId to create user');

        const userRef = doc(this.firestore, `users/${uid}`);
        await setDoc(userRef, {
            ...userData,
            uid,
            tenantId,
            createdAt: new Date()
        });
    }

    /**
     * Actualiza el documento de un usuario.
     */
    async updateUserDoc(uid: string, updates: Partial<UserData>): Promise<void> {
        const userRef = doc(this.firestore, `users/${uid}`);
        await updateDoc(userRef, updates);
    }

    /**
     * Elimina un usuario (soft-delete idealmente, o hard delete).
     */
    async deleteUser(uid: string): Promise<void> {
        const userRef = doc(this.firestore, `users/${uid}`);
        await deleteDoc(userRef);
    }
}
