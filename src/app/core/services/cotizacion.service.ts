import { inject, Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
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
    Timestamp,
    getDoc
} from '@angular/fire/firestore';
import { Observable, from, switchMap, map } from 'rxjs';
import { AuthService } from './auth.service';
import { CatalogoServicio, Cotizacion } from '../models/cotizacion.model';

@Injectable({
    providedIn: 'root'
})
export class CotizacionService {
    private firestore = inject(Firestore);
    private authService = inject(AuthService);

    private async getTenantIdOrThrow(): Promise<string> {
        const tenantId = await this.authService.getTenantId();
        if (!tenantId) {
            throw new Error('No tenantId found for current user');
        }
        return tenantId;
    }

    // ============== CATÁLOGO DE SERVICIOS ==============

    getCatalogo(): Observable<CatalogoServicio[]> {
        return from(this.getTenantIdOrThrow()).pipe(
            switchMap(tenantId => {
                const catalogoRef = collection(this.firestore, 'catalogoServicios');
                const q = query(catalogoRef, where('tenantId', '==', tenantId), orderBy('createdAt', 'desc'));
                return collectionData(q, { idField: 'id' }) as Observable<CatalogoServicio[]>;
            })
        );
    }

    getServicio(id: string): Observable<CatalogoServicio | undefined> {
        const docRef = doc(this.firestore, `catalogoServicios/${id}`);
        return docData(docRef, { idField: 'id' }) as Observable<CatalogoServicio | undefined>;
    }

    async createServicio(servicio: Omit<CatalogoServicio, 'id' | 'tenantId' | 'createdAt'>): Promise<string> {
        const tenantId = await this.getTenantIdOrThrow();
        const catalogoRef = collection(this.firestore, 'catalogoServicios');
        const newServicio: CatalogoServicio = {
            ...servicio,
            tenantId,
            createdAt: serverTimestamp()
        };
        const docRef = await addDoc(catalogoRef, newServicio);
        return docRef.id;
    }

    async updateServicio(id: string, data: Partial<CatalogoServicio>): Promise<void> {
        const docRef = doc(this.firestore, `catalogoServicios/${id}`);
        await updateDoc(docRef, data);
    }

    async deleteServicio(id: string): Promise<void> {
        const docRef = doc(this.firestore, `catalogoServicios/${id}`);
        await deleteDoc(docRef);
    }

    // ============== COTIZACIONES ==============

    getCotizaciones(): Observable<Cotizacion[]> {
        return from(this.getTenantIdOrThrow()).pipe(
            switchMap(tenantId => {
                const cotizacionesRef = collection(this.firestore, 'cotizaciones');
                const q = query(cotizacionesRef, where('tenantId', '==', tenantId), orderBy('createdAt', 'desc'));
                return collectionData(q, { idField: 'id' }) as Observable<Cotizacion[]>;
            })
        );
    }

    getCotizacion(id: string): Observable<Cotizacion | undefined> {
        const docRef = doc(this.firestore, `cotizaciones/${id}`);
        return docData(docRef, { idField: 'id' }) as Observable<Cotizacion | undefined>;
    }

    // Llama a una funcion 'generarCorrelativo' asíncrona del backend en una etapa madura, o delega la asignación.
    // Por ahora lo dejaremos base y el correlativo lo proveerá la UI o una Function temporal
    async createCotizacion(cotizacion: Omit<Cotizacion, 'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'correlativo'>): Promise<string> {
        const tenantId = await this.getTenantIdOrThrow();
        const cotizacionesRef = collection(this.firestore, 'cotizaciones');

        // Obtener un correlativo temporal si el BE no lo hace (Ideal delegar a CF)
        const newCotizacion = {
            ...cotizacion,
            tenantId,
            correlativo: 0, // Should be managed by a CF Trigger ideally or transaction
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(cotizacionesRef, newCotizacion);
        return docRef.id;
    }

    async updateCotizacion(id: string, data: Partial<Cotizacion>): Promise<void> {
        const docRef = doc(this.firestore, `cotizaciones/${id}`);
        const updateData = {
            ...data,
            updatedAt: serverTimestamp()
        };
        await updateDoc(docRef, updateData);
    }

    async deleteCotizacion(id: string): Promise<void> {
        const docRef = doc(this.firestore, `cotizaciones/${id}`);
        await deleteDoc(docRef);
    }
}
