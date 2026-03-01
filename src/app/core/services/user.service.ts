import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, setDoc, updateDoc, deleteDoc, getDocs, query, where } from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { AuthService } from './auth.service';
import { Observable, from, map, switchMap } from 'rxjs';
import { UserData } from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private firestore = inject(Firestore);
    private authService = inject(AuthService);
    private functions = inject(Functions);

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
     * Crea un nuevo miembro del equipo llamando a Cloud Functions.
     * Firebase Auth no permite crear usuarios directamente desde el SDK web seguro.
     */
    async createTeamMember(userData: Partial<UserData>): Promise<{ uid: string, message: string }> {
        const callable = httpsCallable<{ email: string, nombre: string, role: string, password?: string }, { success: boolean, uid: string, message: string }>(this.functions, 'createTeamMember');

        try {
            const result = await callable({
                email: userData.email!,
                nombre: userData.nombre!,
                role: userData.role!
            });
            return { uid: result.data.uid, message: result.data.message };
        } catch (error) {
            console.error('[UserService] Error al crear usuario de equipo', error);
            throw error;
        }
    }

    /**
     * Actualiza un miembro del equipo existente llamando a Cloud Functions.
     */
    async updateTeamMember(data: { uid: string, nombre?: string, role?: string, password?: string, activo?: boolean }): Promise<{ message: string }> {
        const callable = httpsCallable<any, { success: boolean, message: string }>(this.functions, 'updateTeamMember');
        try {
            const result = await callable(data);
            return { message: result.data.message };
        } catch (error) {
            console.error('[UserService] Error al actualizar usuario de equipo', error);
            throw error;
        }
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
