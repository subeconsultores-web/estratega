import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, docData, collectionData, setDoc, updateDoc, deleteDoc, query, where, Timestamp, orderBy } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Cotizacion, CotizacionEstado, CotizacionHistorialEstado } from '../models/cotizacion.model';
import { Observable, of, firstValueFrom } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class CotizacionService {
    private firestore = inject(Firestore);
    private authService = inject(AuthService);
    private collectionName = 'cotizaciones';

    // Obtiene cotizaciones (Admin ve todas, vendedor podría ver solo las suyas luego extendiendo la lógica)
    getCotizaciones(): Observable<Cotizacion[]> {
        return this.authService.user$.pipe(
            switchMap(user => {
                if (!user || !user.tenantId) return of([]);
                const q = query(
                    collection(this.firestore, this.collectionName),
                    where('tenantId', '==', user.tenantId),
                    orderBy('createdAt', 'desc')
                );
                return collectionData(q, { idField: 'id' }) as Observable<Cotizacion[]>;
            })
        );
    }

    // Get por ID
    getCotizacion(id: string): Observable<Cotizacion | undefined> {
        const docRef = doc(this.firestore, `${this.collectionName}/${id}`);
        return docData(docRef, { idField: 'id' }) as Observable<Cotizacion | undefined>;
    }

    // Función interna auxiliar (temporal) para Generar un Correlativo "suave" frontalmente. 
    // TODO: En producción estricta, usar transaction o Cloud Function secuencial.
    private generateMockCorrelativo(): string {
        const date = new Date();
        return `COT-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(Math.random() * 9000) + 1000}`;
    }

    // Crear Documento
    async createCotizacion(payload: Partial<Cotizacion>): Promise<string> {
        const user = await firstValueFrom(this.authService.user$);
        if (!user || !user.tenantId || !user.uid) throw new Error('Usuario inválido o sin tenantId');

        const newDocRef = doc(collection(this.firestore, this.collectionName));

        // Configura el timestamp inical de historial
        const historiaInical: CotizacionHistorialEstado = {
            estado: 'Borrador',
            fecha: Timestamp.now(),
            actorId: user.uid,
            comentario: 'Cotización inicial creada por sistema'
        };

        const cotizacionBase: Cotizacion = {
            ...payload as any,
            id: newDocRef.id,
            tenantId: user.tenantId,
            vendedorId: user.uid,
            correlativo: payload.correlativo || this.generateMockCorrelativo(),
            estadoActual: 'Borrador',
            historialEstados: [historiaInical],
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        };

        await setDoc(newDocRef, cotizacionBase);
        return newDocRef.id;
    }

    // Modificar Documento Base
    async updateCotizacion(id: string, updates: Partial<Cotizacion>): Promise<void> {
        const docRef = doc(this.firestore, `${this.collectionName}/${id}`);
        updates.updatedAt = Timestamp.now();
        return updateDoc(docRef, updates);
    }

    // Cambiar de Estado Oficial (Añadiendo a trazabilidad)
    async changeStatus(id: string, nuevoEstado: CotizacionEstado, historialActual: CotizacionHistorialEstado[], comentario?: string): Promise<void> {
        const user = await firstValueFrom(this.authService.user$);
        const actorId = user ? user.uid : 'SISTEMA_O_CLIENTE'; // Permitir que un cliente modifique el estado via portal público (luego validaremos esto en Function o Rules)

        const nuevoRegistro: CotizacionHistorialEstado = {
            estado: nuevoEstado,
            fecha: Timestamp.now(),
            actorId: actorId,
            comentario: comentario || `Cambiado a ${nuevoEstado}`
        };

        // Agregar al tope histórico (inmutable)
        const nuevoHistorial = [...historialActual, nuevoRegistro];

        const docRef = doc(this.firestore, `${this.collectionName}/${id}`);
        return updateDoc(docRef, {
            estadoActual: nuevoEstado,
            historialEstados: nuevoHistorial,
            updatedAt: Timestamp.now()
        });
    }

    // Delete
    async deleteCotizacion(id: string): Promise<void> {
        const docRef = doc(this.firestore, `${this.collectionName}/${id}`);
        return deleteDoc(docRef);
    }

}
