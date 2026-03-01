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
    serverTimestamp
} from '@angular/fire/firestore';
import { Observable, switchMap, map, of, catchError } from 'rxjs';
import { AuthService } from './auth.service';
import { Proyecto } from '../models/proyectos.model';

@Injectable({
    providedIn: 'root'
})
export class ProyectosService {
    private firestore = inject(Firestore);
    private authService = inject(AuthService);

    private async getTenantIdOrThrow(): Promise<string> {
        const tenantId = await this.authService.getTenantId();
        if (!tenantId) {
            throw new Error('No tenantId found for current user');
        }
        return tenantId;
    }

    getProyectos(): Observable<Proyecto[]> {
        return this.authService.tenantId$.pipe(
            switchMap(tenantId => {
                if (!tenantId) {
                    return of([] as Proyecto[]);
                }
                const ref = collection(this.firestore, 'proyectos');
                const q = query(ref, where('tenantId', '==', tenantId));
                return (collectionData(q, { idField: 'id' }) as Observable<Proyecto[]>).pipe(
                    map(proyectos => proyectos.sort((a, b) => {
                        const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                        const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                        return dateB - dateA;
                    })),
                    catchError(err => {
                        console.error('[Proyectos] Firestore query error:', err);
                        return of([] as Proyecto[]);
                    })
                );
            }),
            catchError(err => {
                console.error('[Proyectos] Error in getProyectos pipe:', err);
                return of([] as Proyecto[]);
            })
        );
    }

    getProyecto(id: string): Observable<Proyecto | undefined> {
        const docRef = doc(this.firestore, `proyectos/${id}`);
        return docData(docRef, { idField: 'id' }) as Observable<Proyecto | undefined>;
    }

    async createProyecto(proyecto: Omit<Proyecto, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<string> {
        const tenantId = await this.getTenantIdOrThrow();
        const ref = collection(this.firestore, 'proyectos');

        const newDoc: Proyecto = {
            ...proyecto,
            tenantId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(ref, newDoc);
        return docRef.id;
    }

    async updateProyecto(id: string, data: Partial<Omit<Proyecto, 'id' | 'tenantId' | 'createdAt'>>): Promise<void> {
        const docRef = doc(this.firestore, `proyectos/${id}`);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    }

    async deleteProyecto(id: string): Promise<void> {
        const docRef = doc(this.firestore, `proyectos/${id}`);
        await deleteDoc(docRef);
    }
}
