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
    Timestamp,
    limit
} from '@angular/fire/firestore';
import { Observable, switchMap, map } from 'rxjs';
import { AuthService } from './auth.service';
import { Transaccion, MetricasFinancieras } from '../models/finanzas.model';
import { Factura } from '../models/factura.model';

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
        return this.authService.tenantId$.pipe(
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
        return new Promise<string>((resolve, reject) => {
            const sub = this.authService.tenantId$.subscribe(async tenantId => {
                if (!tenantId) {
                    sub.unsubscribe();
                    return reject('No tenant ID');
                }
                const ref = collection(this.firestore, 'facturas');
                const newDoc: any = {
                    ...factura,
                    tenantId,
                    createdAt: serverTimestamp() as any,
                    updatedAt: serverTimestamp() as any
                };

                try {
                    const docRef = await addDoc(ref, newDoc);
                    resolve(docRef.id);
                } catch (error) {
                    reject(error);
                } finally {
                    sub.unsubscribe();
                }
            });
        });
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

    getProximosCobros(limite: number = 3): Observable<Factura[]> {
        return this.authService.tenantId$.pipe(
            switchMap(tenantId => {
                const ref = collection(this.firestore, 'facturas');
                const q = query(
                    ref,
                    where('tenantId', '==', tenantId),
                    where('estado', 'in', ['emitida', 'vencida', 'pagada_parcial'])
                    // Ordenamos localmente para evitar requerir un índice compuesto obligatorio en Firebase
                );
                return (collectionData(q, { idField: 'id' }) as Observable<Factura[]>).pipe(
                    map(facturas => {
                        return facturas.sort((a, b) => {
                            const dateA = a.fechaVencimiento as any;
                            const dateB = b.fechaVencimiento as any;
                            const tA = dateA?.seconds ? dateA.seconds : new Date(dateA).getTime() / 1000;
                            const tB = dateB?.seconds ? dateB.seconds : new Date(dateB).getTime() / 1000;
                            return (tA || 0) - (tB || 0);
                        }).slice(0, limite);
                    })
                );
            })
        );
    }

    // ============== TRANSACCIONES (CAJA) ==============

    getTransacciones(): Observable<Transaccion[]> {
        return this.authService.tenantId$.pipe(
            switchMap(tenantId => {
                const ref = collection(this.firestore, 'transacciones');
                const q = query(ref, where('tenantId', '==', tenantId), orderBy('fecha', 'desc'));
                return collectionData(q, { idField: 'id' }) as Observable<Transaccion[]>;
            })
        );
    }

    getTransaccion(id: string): Observable<Transaccion | undefined> {
        return this.authService.tenantId$.pipe(
            switchMap(tenantId => {
                if (!tenantId) return [undefined];
                const docRef = doc(this.firestore, `transacciones/${id}`);
                return docData(docRef, { idField: 'id' }).pipe(
                    map(data => data && (data as any)['tenantId'] === tenantId ? data as Transaccion : undefined)
                );
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

    async updateTransaccion(id: string, data: Partial<Transaccion>): Promise<void> {
        const docRef = doc(this.firestore, `transacciones/${id}`);
        await updateDoc(docRef, data);
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

        const historialMap = new Map<string, { ingresos: number, egresos: number }>();

        snapshotTrans.forEach(doc => {
            const t = doc.data() as Transaccion;
            if (t.estado === 'completado') {
                const fechaDate = t.fecha?.toDate ? t.fecha.toDate() : new Date(t.fecha);
                const diaStr = fechaDate.toISOString().split('T')[0];

                if (!historialMap.has(diaStr)) {
                    historialMap.set(diaStr, { ingresos: 0, egresos: 0 });
                }

                if (t.tipo === 'ingreso') {
                    ingresosMesActual += t.monto;
                    historialMap.get(diaStr)!.ingresos += t.monto;
                    if (t.categoria === 'suscripcion') {
                        mrrSimulado += t.monto;
                    }
                } else if (t.tipo === 'egreso') {
                    egresosMesActual += t.monto;
                    historialMap.get(diaStr)!.egresos += t.monto;
                }
            }
        });

        // Ordenamos el historial temporalmente para la gráfica
        const historialArray = Array.from(historialMap.entries())
            .map(([fecha, data]) => ({ fecha, ...data }))
            .sort((a, b) => a.fecha.localeCompare(b.fecha));

        let porCobrar = 0;
        snapshotFact.forEach(doc => {
            const f = doc.data() as Factura;
            porCobrar += (f.montoPendiente !== undefined ? f.montoPendiente : f.total);
        });

        return {
            mrr: mrrSimulado,
            ingresosMesActual,
            egresosMesActual,
            porCobrar,
            crecimientoMRR: mrrSimulado > 0 ? 5.2 : 0, // Still mocked growth metric for now
            historial: historialArray
        };
    }
}
