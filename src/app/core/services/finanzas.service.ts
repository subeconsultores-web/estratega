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
    getDocs,
    Timestamp
} from '@angular/fire/firestore';
import { Observable, from, switchMap, map } from 'rxjs';
import { AuthService } from './auth.service';
import { Factura, Transaccion, MetricasFinancieras } from '../models/finanzas.model';

@Injectable({
    providedIn: 'root'
})
export class FinanzasService {
    private firestore = inject(Firestore);
    private authService = inject(AuthService);

    private async getTenantIdOrThrow(): Promise<string> {
        const tenantId = await this.authService.getTenantId();
        if (!tenantId) {
            throw new Error('No tenantId found for current user');
        }
        return tenantId;
    }

    // ============== FACTURAS / COBROS ==============

    getFacturas(): Observable<Factura[]> {
        return from(this.getTenantIdOrThrow()).pipe(
            switchMap(tenantId => {
                const ref = collection(this.firestore, 'facturas');
                const q = query(ref, where('tenantId', '==', tenantId), orderBy('createdAt', 'desc'));
                return collectionData(q, { idField: 'id' }) as Observable<Factura[]>;
            })
        );
    }

    getFactura(id: string): Observable<Factura | undefined> {
        const docRef = doc(this.firestore, `facturas/${id}`);
        return docData(docRef, { idField: 'id' }) as Observable<Factura | undefined>;
    }

    async createFactura(factura: Omit<Factura, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<string> {
        const tenantId = await this.getTenantIdOrThrow();
        const ref = collection(this.firestore, 'facturas');

        const newDoc: Factura = {
            ...factura,
            tenantId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(ref, newDoc);
        return docRef.id;
    }

    async updateFactura(id: string, data: Partial<Factura>): Promise<void> {
        const docRef = doc(this.firestore, `facturas/${id}`);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    }

    async deleteFactura(id: string): Promise<void> {
        const docRef = doc(this.firestore, `facturas/${id}`);
        await deleteDoc(docRef);
    }

    // ============== TRANSACCIONES (CAJA) ==============

    getTransacciones(): Observable<Transaccion[]> {
        return from(this.getTenantIdOrThrow()).pipe(
            switchMap(tenantId => {
                const ref = collection(this.firestore, 'transacciones');
                const q = query(ref, where('tenantId', '==', tenantId), orderBy('fecha', 'desc'));
                return collectionData(q, { idField: 'id' }) as Observable<Transaccion[]>;
            })
        );
    }

    async createTransaccion(transaccion: Omit<Transaccion, 'id' | 'tenantId' | 'createdAt'>): Promise<string> {
        const tenantId = await this.getTenantIdOrThrow();
        const ref = collection(this.firestore, 'transacciones');

        const newDoc: Transaccion = {
            ...transaccion,
            tenantId,
            createdAt: serverTimestamp()
        };

        const docRef = await addDoc(ref, newDoc);

        // Opcional: Si está atada a una factura, descontar el saldoPendiente via Cloud Function preferiblemente.
        // Aquí podríamos disparar un actualizador optimista.

        return docRef.id;
    }

    // ============== MÉTRICAS Y DASHBOARD ==============

    // Las métricas financieras (MRR, etc) se calculan idealmente en Cloud Functions en jobs nocturnos
    // O leyendo colecciones agregadas. Para prototipo, hacemos un cálculo rápido frontend o pedimos mock
    async getMetricasResumen(): Promise<MetricasFinancieras> {
        const tenantId = await this.getTenantIdOrThrow();

        // Prototipo: Leer transacciones de los ultimos 30 dias (Mock logic)
        const ahora = new Date();
        const haceUnMes = new Date();
        haceUnMes.setMonth(ahora.getMonth() - 1);

        const ref = collection(this.firestore, 'transacciones');
        const q = query(
            ref,
            where('tenantId', '==', tenantId),
            where('fecha', '>=', Timestamp.fromDate(haceUnMes))
        );

        const snapshot = await getDocs(q);
        let ingresosMesActual = 0;
        let egresosMesActual = 0;

        snapshot.forEach(doc => {
            const t = doc.data() as Transaccion;
            if (t.tipo === 'ingreso' && t.estado === 'completado') ingresosMesActual += t.monto;
            if (t.tipo === 'egreso' && t.estado === 'completado') egresosMesActual += t.monto;
        });

        return {
            mrr: ingresosMesActual * 0.4, // Simulado
            ingresosMesActual,
            egresosMesActual,
            porCobrar: 154000, // Simulado
            crecimientoMRR: 12.5
        }
    }
}
