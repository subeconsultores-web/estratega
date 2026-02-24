import { Injectable, inject, NgZone } from '@angular/core';
import { Firestore, collection, doc, docData, setDoc, updateDoc, deleteDoc, query, where, collectionData, Timestamp, orderBy, addDoc } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { Observable, from, throwError, of } from 'rxjs';
import { switchMap, tap, catchError, distinctUntilChanged, take, shareReplay } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Cliente, Actividad } from '../models/crm.model';

@Injectable({
    providedIn: 'root'
})
export class CrmService {
    private firestore = inject(Firestore);
    private storage = inject(Storage);
    private authService = inject(AuthService);
    private ngZone = inject(NgZone);

    private async getTenantIdOrThrow(): Promise<string> {
        const tenantId = await this.authService.getTenantId();
        if (!tenantId) {
            throw new Error('Usuario no autenticado o sin Tenant asignado');
        }
        return tenantId;
    }

    // ---- CLIENTES ----
    private clientesCache$: Observable<Cliente[]> | null = null;

    // Obtener lista de clientes como Observable (Real-time)
    getClientes(): Observable<Cliente[]> {
        if (!this.clientesCache$) {
            console.log('[CRM] getClientes() cache miss, building pipeline...');
            this.clientesCache$ = this.authService.tenantId$.pipe(
                tap(tenantId => console.log('[CRM] tenantId$ emitted:', tenantId)),
                distinctUntilChanged(),
                switchMap(tenantId => {
                    if (!tenantId) {
                        console.error('[CRM] tenantId is null/undefined, cannot query clientes');
                        return of([] as Cliente[]);
                    }
                    const clientesRef = collection(this.firestore, 'clientes');
                    const q = query(clientesRef, where('tenantId', '==', tenantId), orderBy('createdAt', 'desc'));
                    console.log('[CRM] Firestore query created for tenantId:', tenantId);
                    return (collectionData(q, { idField: 'id' }) as Observable<Cliente[]>).pipe(
                        tap(data => console.log('[CRM] Firestore returned', data.length, 'clientes')),
                        catchError(innerErr => {
                            console.error('[CRM] Firestore query error:', innerErr);
                            return of([] as Cliente[]);
                        })
                    );
                }),
                catchError(err => {
                    console.error('[CRM] Error in getClientes pipe:', err);
                    return of([] as Cliente[]);
                }),
                shareReplay({ bufferSize: 1, refCount: true })
            );
        }
        return this.clientesCache$;
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

    private actividadesCache = new Map<string, Observable<Actividad[]>>();

    getActividadesCliente(clienteId: string): Observable<Actividad[]> {
        if (!this.actividadesCache.has(clienteId)) {
            const cache$ = from(this.getTenantIdOrThrow()).pipe(
                switchMap(tenantId => {
                    const actividadesRef = collection(this.firestore, 'actividades');
                    const q = query(
                        actividadesRef,
                        where('tenantId', '==', tenantId),
                        where('clienteId', '==', clienteId),
                        orderBy('fecha', 'desc')
                    );
                    return collectionData(q, { idField: 'id' }) as Observable<Actividad[]>;
                }),
                shareReplay({ bufferSize: 1, refCount: true })
            );
            this.actividadesCache.set(clienteId, cache$);
        }
        return this.actividadesCache.get(clienteId)!;
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

    // ---- DOCUMENTOS E IA OCR ----

    async uploadDocumento(clienteId: string, file: File): Promise<string> {
        const tenantId = await this.getTenantIdOrThrow();
        // Path esperado por la Cloud Function: clientes/{tenantId}/{clienteId}/documentos/{file.name}
        const filePath = `clientes/${tenantId}/${clienteId}/documentos/${Date.now()}_${file.name}`;
        const storageRef = ref(this.storage, filePath);

        const snapshot = await uploadBytes(storageRef, file);
        return getDownloadURL(snapshot.ref);
    }

    getDocumentosCliente(clienteId: string): Observable<any[]> {
        // La meta-data de los archivos analizados se guarda en: clientes/{clienteId}/archivos
        const docsRef = collection(this.firestore, `clientes/${clienteId}/archivos`);
        const q = query(docsRef, orderBy('fechaSubida', 'desc'));
        return collectionData(q, { idField: 'id' }) as Observable<any[]>;
    }
}
