import { inject, Injectable } from '@angular/core';
import {
    Firestore,
    collection,
    collectionData,
    doc,
    docData,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    writeBatch
} from '@angular/fire/firestore';
import { Observable, from, switchMap } from 'rxjs';
import { AuthService } from './auth.service';
import { Tarea, TareaEstado } from '../models/proyectos.model';

@Injectable({
    providedIn: 'root'
})
export class TareasService {
    private firestore = inject(Firestore);
    private authService = inject(AuthService);

    private async getTenantIdOrThrow(): Promise<string> {
        const tenantId = await this.authService.getTenantId();
        if (!tenantId) {
            throw new Error('No tenantId found for current user');
        }
        return tenantId;
    }

    getTareasByProyecto(proyectoId: string): Observable<Tarea[]> {
        return from(this.getTenantIdOrThrow()).pipe(
            switchMap(tenantId => {
                const ref = collection(this.firestore, 'tareas');
                const q = query(
                    ref,
                    where('tenantId', '==', tenantId),
                    where('proyectoId', '==', proyectoId),
                    orderBy('orden', 'asc'),
                    orderBy('createdAt', 'desc')
                );
                return collectionData(q, { idField: 'id' }) as Observable<Tarea[]>;
            })
        );
    }

    getTarea(id: string): Observable<Tarea | undefined> {
        const docRef = doc(this.firestore, `tareas/${id}`);
        return docData(docRef, { idField: 'id' }) as Observable<Tarea | undefined>;
    }

    async createTarea(tarea: Omit<Tarea, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<string> {
        const tenantId = await this.getTenantIdOrThrow();
        const ref = collection(this.firestore, 'tareas');

        const newDoc: Tarea = {
            ...tarea,
            tenantId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(ref, newDoc);
        return docRef.id;
    }

    async updateTarea(id: string, data: Partial<Omit<Tarea, 'id' | 'tenantId' | 'createdAt'>>): Promise<void> {
        const docRef = doc(this.firestore, `tareas/${id}`);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    }

    async deleteTarea(id: string): Promise<void> {
        const docRef = doc(this.firestore, `tareas/${id}`);
        await deleteDoc(docRef);
    }

    /**
     * Kanban atomic updates 
     */
    async updateTareaEstado(id: string, nuevoEstado: TareaEstado, nuevoOrden: number): Promise<void> {
        const docRef = doc(this.firestore, `tareas/${id}`);
        await updateDoc(docRef, {
            estado: nuevoEstado,
            orden: nuevoOrden,
            updatedAt: serverTimestamp()
        });
    }

    // Optional bulk update if re-ordering multiple items in a column
    async updateBatchOrder(tareas: { id: string, orden: number }[]): Promise<void> {
        const batch = writeBatch(this.firestore);

        tareas.forEach(t => {
            const docRef = doc(this.firestore, `tareas/${t.id}`);
            batch.update(docRef, { orden: t.orden });
        });

        await batch.commit();
    }
}
