import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, collectionData, docData, setDoc, updateDoc, deleteDoc, addDoc, query, where, orderBy, getDocs, limit, FieldValue, serverTimestamp, runTransaction } from '@angular/fire/firestore';
import { Observable, from, map } from 'rxjs';
import { Factura } from '../models/factura.model';

@Injectable({
    providedIn: 'root'
})
export class FacturaService {
    private firestore = inject(Firestore);

    constructor() { }

    // ---------------------------------------------------------
    // Obtención
    // ---------------------------------------------------------

    getFacturas(tenantId?: string): Observable<Factura[]> {
        const facturasRef = collection(this.firestore, 'facturas');
        let q;
        if (tenantId) {
            q = query(
                facturasRef,
                where('tenantId', '==', tenantId),
                orderBy('createdAt', 'desc')
            );
        } else {
            // Client Portal instances resolve by Firebase Rules natively based on Auth UID
            q = query(
                facturasRef,
                orderBy('createdAt', 'desc')
            );
        }

        return collectionData(q, { idField: 'id' }).pipe(
            map(data => data as Factura[])
        );
    }

    getFacturasCliente(tenantId: string, clienteId: string): Observable<Factura[]> {
        const facturasRef = collection(this.firestore, 'facturas');
        const q = query(
            facturasRef,
            where('tenantId', '==', tenantId),
            where('clienteId', '==', clienteId),
            orderBy('createdAt', 'desc')
        );
        return collectionData(q, { idField: 'id' }).pipe(
            map(data => data as Factura[])
        );
    }

    getFactura(id: string): Observable<Factura | undefined> {
        const facturaRef = doc(this.firestore, 'facturas', id);
        return docData(facturaRef, { idField: 'id' }).pipe(
            map(data => data ? data as Factura : undefined)
        );
    }

    // ---------------------------------------------------------
    // Creación y Correlativos
    // ---------------------------------------------------------

    async createFactura(facturaData: Omit<Factura, 'id' | 'correlativo' | 'codigoFormateado' | 'createdAt' | 'updatedAt'>): Promise<string> {
        const { tenantId } = facturaData;
        const configRef = doc(this.firestore, `tenants/${tenantId}/config/general`);

        // Usamos una trasacción para asegurar correlativos únicos atómicos
        return runTransaction(this.firestore, async (transaction) => {
            const configDoc = await transaction.get(configRef);
            let nuevoCorrelativo = 1;

            if (configDoc.exists()) {
                const docData = configDoc.data();
                if (docData['correlativos'] && typeof docData['correlativos']['factura'] === 'number') {
                    nuevoCorrelativo = docData['correlativos']['factura'] + 1;
                }
            }

            // Preparar el código visible
            const prefijo = 'INV'; // Invoice
            const codigoPadding = String(nuevoCorrelativo).padStart(4, '0');
            const codigoFormateado = `${prefijo}-${codigoPadding}`;

            // Insertar Doc
            const nuevaFacturaRef = doc(collection(this.firestore, 'facturas'));
            transaction.set(nuevaFacturaRef, {
                ...facturaData,
                correlativo: nuevoCorrelativo,
                codigoFormateado: codigoFormateado,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            // Actualizar contador del Tenant
            transaction.set(configRef, {
                correlativos: { factura: nuevoCorrelativo }
            }, { merge: true });

            return nuevaFacturaRef.id;
        });
    }

    // ---------------------------------------------------------
    // Actualización
    // ---------------------------------------------------------

    async updateFactura(id: string, data: Partial<Factura>): Promise<void> {
        const facturaRef = doc(this.firestore, 'facturas', id);
        await updateDoc(facturaRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    }

    async cambiarEstado(id: string, nuevoEstado: Factura['estado']): Promise<void> {
        const facturaRef = doc(this.firestore, 'facturas', id);
        await updateDoc(facturaRef, {
            estado: nuevoEstado,
            updatedAt: serverTimestamp()
        });
    }

    async deleteFactura(id: string): Promise<void> {
        const facturaRef = doc(this.firestore, 'facturas', id);
        await deleteDoc(facturaRef);
    }

    // --- Stripe Integration Stub ---
    async getCheckoutUrl(facturaId: string): Promise<string | null> {
        // This typically calls a Firebase Cloud function to generate a Stripe Checkout Session
        // For now, return a placeholder or read the url if saved in DB directly
        const docSnap = await getDocs(query(collection(this.firestore, 'facturas'), where('id', '==', facturaId)));
        if (!docSnap.empty) {
            const data = docSnap.docs[0].data() as Factura;
            return data.urlStripeCheckout || null;
        }
        return null;
    }
}
