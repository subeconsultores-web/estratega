import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, docData, setDoc, updateDoc, deleteDoc, query, where, collectionData, Timestamp, orderBy, addDoc } from '@angular/fire/firestore';
import { Observable, from, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Cliente, Actividad } from '../models/crm.model';

@Injectable({
    providedIn: 'root'
})
export class CrmService {
    private firestore = inject(Firestore);
    private authService = inject(AuthService);

    private async getTenantIdOrThrow(): Promise<string> {
        const tenantId = await this.authService.getTenantId();
        if (!tenantId) {
            throw new Error('Usuario no autenticado o sin Tenant asignado');
        }
        return tenantId;
    }

    // ---- CLIENTES ----

    // Obtener lista de clientes como Observable (Real-time)
    getClientes(): Observable<Cliente[]> {
        return from(this.getTenantIdOrThrow()).pipe(
            switchMap(tenantId => {
                const clientesRef = collection(this.firestore, 'clientes');
                const q = query(clientesRef, where('tenantId', '==', tenantId), orderBy('createdAt', 'desc'));
                return collectionData(q, { idField: 'id' }) as Observable<Cliente[]>;
            })
        );
    }

    // Obtener cliente por ID
    getCliente(id: string): Observable<Cliente | undefined> {
        const docRef = doc(this.firestore, `clientes/${id}`);
        return docData(docRef, { idField: 'id' }) as Observable<Cliente | undefined>;
    }

    async createCliente(clienteData: Partial<Cliente>): Promise<string> {
        const tenantId = await this.getTenantIdOrThrow();
        const clientesRef = collection(this.firestore, 'clientes');

        const newCliente = {
            ...clienteData,
            tenantId,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        };

        const docRef = await addDoc(clientesRef, newCliente);
        return docRef.id;
    }

    async updateCliente(id: string, clienteData: Partial<Cliente>): Promise<void> {
        const tenantId = await this.getTenantIdOrThrow();
        const docRef = doc(this.firestore, `clientes/${id}`);
        await updateDoc(docRef, {
            ...clienteData,
            updatedAt: Timestamp.now()
        });
    }

    async deleteCliente(id: string): Promise<void> {
        // Importante: validar lógica de retención o dependencias antes de borrar en producción
        const docRef = doc(this.firestore, `clientes/${id}`);
        await deleteDoc(docRef);
    }

    // ---- ACTIVIDADES ----

    getActividadesCliente(clienteId: string): Observable<Actividad[]> {
        return from(this.getTenantIdOrThrow()).pipe(
            switchMap(tenantId => {
                const actividadesRef = collection(this.firestore, 'actividades');
                const q = query(
                    actividadesRef,
                    where('tenantId', '==', tenantId),
                    where('clienteId', '==', clienteId),
                    orderBy('fecha', 'desc')
                );
                return collectionData(q, { idField: 'id' }) as Observable<Actividad[]>;
            })
        );
    }

    async createActividad(actividadData: Partial<Actividad>): Promise<string> {
        const tenantId = await this.getTenantIdOrThrow();
        const currentUser = this.authService['auth'].currentUser;

        const actividadesRef = collection(this.firestore, 'actividades');
        const newActividad = {
            ...actividadData,
            tenantId,
            usuarioId: currentUser?.uid || '',
            createdAt: Timestamp.now()
        };

        const docRef = await addDoc(actividadesRef, newActividad);
        return docRef.id;
    }

    async updateActividad(id: string, actividadData: Partial<Actividad>): Promise<void> {
        const docRef = doc(this.firestore, `actividades/${id}`);
        await updateDoc(docRef, actividadData);
    }

    async deleteActividad(id: string): Promise<void> {
        const docRef = doc(this.firestore, `actividades/${id}`);
        await deleteDoc(docRef);
    }
}
