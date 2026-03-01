import { Injectable, inject, NgZone } from '@angular/core';
import { Firestore, collection, doc, docData, setDoc, updateDoc, deleteDoc, query, where, collectionData, Timestamp, orderBy, addDoc } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL, getBytes } from '@angular/fire/storage';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Observable, from, throwError, of } from 'rxjs';
import { switchMap, catchError, distinctUntilChanged, take, shareReplay } from 'rxjs/operators';
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
    private functions = inject(Functions);

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
            this.clientesCache$ = this.authService.tenantId$.pipe(
                distinctUntilChanged(),
                switchMap(tenantId => {
                    if (!tenantId) {
                        return of([] as Cliente[]);
                    }
                    const clientesRef = collection(this.firestore, 'clientes');
                    const q = query(clientesRef, where('tenantId', '==', tenantId), orderBy('createdAt', 'desc'));
                    return (collectionData(q, { idField: 'id' }) as Observable<Cliente[]>).pipe(
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

    async retryAnalisisIA(documento: any): Promise<any> {
        try {
            // Descargar archivo primero como Blob, convertir a base64
            // y enviarlo a analyzeDocument
            const storageRef = ref(this.storage, documento.storagePath);
            const arrayBuffer = await getBytes(storageRef);

            // Convert ArrayBuffer to Base64
            let binary = '';
            const bytes = new Uint8Array(arrayBuffer);
            const len = bytes.byteLength;
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            const base64Data = window.btoa(binary);

            const analyzeDoc = httpsCallable(this.functions, 'analyzeDocument');
            const result = await analyzeDoc({
                fileBase64: base64Data,
                mimeType: documento.contentType
            });

            // Parse result and update Firestore document
            const dataExtraida: any = result.data;
            const docRef = doc(this.firestore, `clientes/${documento.clienteId || documento.storagePath.split('/')[2]}/archivos/${documento.id}`);

            await updateDoc(docRef, {
                ocrData: {
                    tipoDocumento: dataExtraida.categoria || dataExtraida.tipoDocumento || 'Desconocido',
                    fechaEmision: dataExtraida.fecha || dataExtraida.fechaEmision || 'N/A',
                    montoTotal: dataExtraida.monto || dataExtraida.montoTotal || 'N/A',
                    partesInvolucradas: [dataExtraida.proveedor].filter(Boolean) || [],
                    resumenCorto: dataExtraida.notas || dataExtraida.resumen || 'Análisis completado.'
                },
                analizadoPorIA: true,
                updatedAt: Timestamp.now()
            });

            return result.data;
        } catch (error) {
            console.error('Error re-analizando documento', error);
            throw error;
        }
    }
}
