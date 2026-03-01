import { inject, Injectable } from '@angular/core';
import {
    Firestore,
    collection,
    collectionData,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp,
    getDocs
} from '@angular/fire/firestore';
import { from, map, Observable, switchMap } from 'rxjs';
import { RegistroTiempo } from '../models/registro-tiempo.model';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class RegistroTiempoService {
    private firestore = inject(Firestore);
    private authService = inject(AuthService);
    private basePath = 'registros_tiempo';

    constructor() { }

    private getCollectionRef() {
        return collection(this.firestore, this.basePath);
    }

    getRegistrosByProyecto(proyectoId: string): Observable<RegistroTiempo[]> {
        return from(this.authService.getTenantId()).pipe(
            switchMap(tenantId => {
                if (!tenantId) throw new Error('Tenant ID no encontrado');

                const q = query(
                    this.getCollectionRef(),
                    where('tenantId', '==', tenantId),
                    where('proyectoId', '==', proyectoId),
                    orderBy('fecha', 'desc')
                );

                return collectionData(q, { idField: 'id' }).pipe(
                    map(data => (data as any[]).map(r => r as RegistroTiempo))
                );
            })
        );
    }
    getRegistrosByUsuario(usuarioId: string): Observable<RegistroTiempo[]> {
        return from(this.authService.getTenantId()).pipe(
            switchMap(tenantId => {
                if (!tenantId) throw new Error('Tenant ID no encontrado');

                const q = query(
                    this.getCollectionRef(),
                    where('tenantId', '==', tenantId),
                    where('usuarioId', '==', usuarioId),
                    orderBy('fecha', 'desc')
                );

                return collectionData(q, { idField: 'id' }).pipe(
                    map(data => (data as any[]).map(r => r as RegistroTiempo))
                );
            })
        );
    }
    async addRegistro(registro: Partial<RegistroTiempo>): Promise<string> {
        const tenantId = await this.authService.getTenantId();
        if (!tenantId) throw new Error('Tenant ID no encontrado');

        const dataToSave = {
            ...registro,
            tenantId,
            createdAt: Timestamp.now()
        };

        const docRef = await addDoc(this.getCollectionRef(), dataToSave);

        // Si queremos actualizar las horas invertidas del proyecto, lo podemos disparar aquí o mediante una Cloud Function.
        // Usualmente se hace en Cloud Functions (onWrite) para no depender de la app cliente.

        return docRef.id;
    }

    async updateRegistro(id: string, data: Partial<RegistroTiempo>): Promise<void> {
        const docRef = doc(this.firestore, `${this.basePath}/${id}`);
        await updateDoc(docRef, { ...data, updatedAt: Timestamp.now() });
    }

    async deleteRegistro(id: string): Promise<void> {
        const docRef = doc(this.firestore, `${this.basePath}/${id}`);
        await deleteDoc(docRef);
    }
}
