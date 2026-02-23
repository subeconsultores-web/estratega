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

        const ahora = new Date();
        const haceUnMes = new Date();
        haceUnMes.setMonth(ahora.getMonth() - 1);

        // 1. Fetch Transacciones for current month (Ingresos, Egresos, MRR)
        const refTransacciones = collection(this.firestore, 'transacciones');
        const qTrans = query(
            refTransacciones,
            where('tenantId', '==', tenantId),
            where('fecha', '>=', Timestamp.fromDate(haceUnMes))
        );

        // 2. Fetch Facturas for 'porCobrar' (Pending accounts receivable)
        const refFacturas = collection(this.firestore, 'facturas');
        const qFact = query(
            refFacturas,
            where('tenantId', '==', tenantId),
            where('estado', 'in', ['borrador', 'enviada', 'vencida', 'parcial'])
        );

        const [snapshotTrans, snapshotFact] = await Promise.all([
            getDocs(qTrans),
            getDocs(qFact)
        ]);

        let ingresosMesActual = 0;
        let egresosMesActual = 0;
        let mrrSimulado = 0; // Sum of recurring subscriptions this month

        snapshotTrans.forEach(doc => {
            const t = doc.data() as Transaccion;
            if (t.estado === 'completado') {
                if (t.tipo === 'ingreso') {
                    ingresosMesActual += t.monto;
                    if (t.categoria === 'suscripcion') {
                        mrrSimulado += t.monto;
                    }
                }
                if (t.tipo === 'egreso') {
                    egresosMesActual += t.monto;
                }
            }
        });

        let porCobrar = 0;
        snapshotFact.forEach(doc => {
            const f = doc.data() as Factura;
            porCobrar += (f.saldoPendiente || f.total || 0);
        });

        return {
            mrr: mrrSimulado,
            ingresosMesActual,
            egresosMesActual,
            porCobrar,
            crecimientoMRR: mrrSimulado > 0 ? 5.2 : 0 // Still mocked growth metric for now
        };
    }
}
