import { inject, Injectable } from '@angular/core';
import {
    Firestore,
    collection,
    collectionData,
    doc,
    docData,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    limit
} from '@angular/fire/firestore';
import { Observable, switchMap, map } from 'rxjs';
import { AuthService } from './auth.service';
import { Conversacion, Mensaje } from '../models/mensaje.model';

@Injectable({
    providedIn: 'root'
})
export class MensajeriaService {
    private firestore = inject(Firestore);
    private authService = inject(AuthService);

    // ============== CONVERSACIONES ==============

    getConversaciones(): Observable<Conversacion[]> {
        return this.authService.tenantId$.pipe(
            switchMap(tenantId => {
                const ref = collection(this.firestore, 'conversaciones');
                const q = query(
                    ref,
                    where('tenantId', '==', tenantId),
                    where('estado', '==', 'abierta'),
                    orderBy('ultimoMensajeAt', 'desc')
                );
                return collectionData(q, { idField: 'id' }) as Observable<Conversacion[]>;
            })
        );
    }

    getConversacion(id: string): Observable<Conversacion | undefined> {
        const docRef = doc(this.firestore, `conversaciones/${id}`);
        return docData(docRef, { idField: 'id' }) as Observable<Conversacion | undefined>;
    }

    async createConversacion(data: {
        clienteId: string;
        clienteNombre: string;
        asunto: string;
        canal?: 'interno' | 'whatsapp' | 'email';
    }): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const sub = this.authService.tenantId$.subscribe(async tenantId => {
                if (!tenantId) { sub.unsubscribe(); return reject('No tenant ID'); }
                const user = await this.authService.getCurrentUser();
                const uid = user?.uid;
                const ref = collection(this.firestore, 'conversaciones');
                try {
                    const docRef = await addDoc(ref, {
                        tenantId,
                        clienteId: data.clienteId,
                        clienteNombre: data.clienteNombre,
                        canal: data.canal || 'interno',
                        asunto: data.asunto,
                        participantes: uid ? [uid] : [],
                        noLeidos: 0,
                        estado: 'abierta',
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
                    resolve(docRef.id);
                } catch (error) {
                    reject(error);
                } finally {
                    sub.unsubscribe();
                }
            });
        });
    }

    // ============== MENSAJES ==============

    getMensajes(conversacionId: string, limite = 50): Observable<Mensaje[]> {
        const ref = collection(this.firestore, 'mensajes');
        const q = query(
            ref,
            where('conversacionId', '==', conversacionId),
            orderBy('createdAt', 'asc'),
            limit(limite)
        );
        return collectionData(q, { idField: 'id' }) as Observable<Mensaje[]>;
    }

    async enviarMensaje(conversacionId: string, contenido: string, autorNombre: string, autorTipo: 'interno' | 'cliente' | 'ia' = 'interno'): Promise<void> {
        const user = await this.authService.getCurrentUser();
        const uid = user?.uid || 'system';
        const refMensajes = collection(this.firestore, 'mensajes');

        await addDoc(refMensajes, {
            conversacionId,
            autorId: uid,
            autorNombre,
            autorTipo,
            contenido,
            leido: false,
            createdAt: serverTimestamp()
        });

        // Actualizar la conversación con el último mensaje
        const convRef = doc(this.firestore, `conversaciones/${conversacionId}`);
        await updateDoc(convRef, {
            ultimoMensaje: contenido.substring(0, 100),
            ultimoMensajeAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    }

    async cerrarConversacion(conversacionId: string): Promise<void> {
        const convRef = doc(this.firestore, `conversaciones/${conversacionId}`);
        await updateDoc(convRef, {
            estado: 'cerrada',
            updatedAt: serverTimestamp()
        });
    }
}
