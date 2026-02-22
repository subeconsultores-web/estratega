import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, docData, addDoc, updateDoc, query, where, Timestamp } from '@angular/fire/firestore';
import { Storage, ref, uploadString, getDownloadURL, uploadBytes } from '@angular/fire/storage';
import { Observable } from 'rxjs';
import { Contrato, EstadoContrato, FirmaData } from '../models/contrato.model';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class ContratoService {
    private firestore = inject(Firestore);
    private storage = inject(Storage);
    private authService = inject(AuthService);
    private collectionName = 'contratos';

    constructor() { }

    getContratos(tenantId: string): Observable<Contrato[]> {
        const contratosRef = collection(this.firestore, this.collectionName);
        const q = query(contratosRef, where('tenantId', '==', tenantId));
        return collectionData(q, { idField: 'id' }) as Observable<Contrato[]>;
    }

    getContratoById(id: string): Observable<Contrato> {
        const contratoRef = doc(this.firestore, `${this.collectionName}/${id}`);
        return docData(contratoRef, { idField: 'id' }) as Observable<Contrato>;
    }

    async createContrato(contrato: Contrato): Promise<string> {
        const contratosRef = collection(this.firestore, this.collectionName);
        const user = await this.authService.getCurrentUser();

        // Base setup
        const newContrato = {
            ...contrato,
            estadoActual: 'Borrador' as EstadoContrato,
            historialEstados: [{
                estado: 'Borrador' as EstadoContrato,
                fecha: Timestamp.now(),
                actorId: user?.uid || 'system',
                comentario: 'Contrato generado inicial'
            }],
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        };

        const docRef = await addDoc(contratosRef, newContrato);
        return docRef.id;
    }

    async updateContrato(id: string, data: Partial<Contrato>): Promise<void> {
        const contratoRef = doc(this.firestore, `${this.collectionName}/${id}`);
        const updateData = {
            ...data,
            updatedAt: Timestamp.now()
        };
        return updateDoc(contratoRef, updateData);
    }

    async cambiarEstado(id: string, nuevoEstado: EstadoContrato, comentario?: string, firmaData?: FirmaData): Promise<void> {
        const user = await this.authService.getCurrentUser();

        const nuevoEvento = {
            estado: nuevoEstado,
            fecha: Timestamp.now(),
            actorId: user?.uid || 'system',
            comentario: comentario || `Cambio de estado a ${nuevoEstado}`
        };

        // Obtain current history array, then append but we can't easily read inside an updateDoc without reading first
        // We expect the backend Function or just client reading to append properly. Here we will use arrayUnion if we had access to FieldValue easily.
        // For now we will fetch the doc first.
        return new Promise((resolve, reject) => {
            const docRef = doc(this.firestore, `${this.collectionName}/${id}`);
            // This requires an extra read, but typical in simple apps. Real apps use transactions.
            docData(docRef, { idField: 'id' }).subscribe({
                next: async (contrato: any) => {
                    const historial = contrato.historialEstados || [];
                    historial.push(nuevoEvento);

                    const updatePayload: any = {
                        estadoActual: nuevoEstado,
                        historialEstados: historial,
                        updatedAt: Timestamp.now()
                    };

                    if (nuevoEstado === 'Firmado') {
                        updatePayload.fechaFirma = Timestamp.now();
                    }

                    if (firmaData) {
                        updatePayload.firmaData = firmaData;
                    }

                    try {
                        await updateDoc(docRef, updatePayload);
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                },
                error: (e) => reject(e)
            });
        });
    }

    // --- Firmas ---

    /**
     * Sube una imagen Data URL (Canvas) a Storage
     */
    async uploadFirmaDibujo(tenantId: string, contratoId: string, dataUrl: string): Promise<string> {
        const timestamp = new Date().getTime();
        const filePath = `tenants/${tenantId}/contratos/${contratoId}/firma_${timestamp}.png`;
        const storageRef = ref(this.storage, filePath);

        await uploadString(storageRef, dataUrl, 'data_url');
        return getDownloadURL(storageRef);
    }

    /**
     * Sube un File Binario (Upload PNG/JPG) a Storage
     */
    async uploadFirmaFile(tenantId: string, contratoId: string, file: File): Promise<string> {
        const timestamp = new Date().getTime();
        const filePath = `tenants/${tenantId}/contratos/${contratoId}/firma_upload_${timestamp}_${file.name}`;
        const storageRef = ref(this.storage, filePath);

        await uploadBytes(storageRef, file);
        return getDownloadURL(storageRef);
    }

}
