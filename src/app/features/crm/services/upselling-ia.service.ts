import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Firestore, collection, query, collectionGroup, where, orderBy, doc, updateDoc, collectionData, getDocs } from '@angular/fire/firestore';
import { Observable, of, from } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

export interface OportunidadUpselling {
    id?: string;
    clienteId: string;
    servicioSugerido: string;
    razonComercial: string;
    probabilidadXito: 'Alta' | 'Media' | 'Baja';
    estado: 'pendiente' | 'contactado' | 'descartado' | 'ganado';
    fechaGeneracion?: any;
    // Opcional: datos del cliente si hacemos join manual
    nombreEmpresa?: string;
}

@Injectable({
    providedIn: 'root'
})
export class UpsellingIAService {
    private functions = inject(Functions);
    private firestore = inject(Firestore);
    private authService = inject(AuthService);

    // 1. Llamar a Gemini para escanear la base y generar sugerencias
    async generarSugerencias(): Promise<any> {
        const callable = httpsCallable(this.functions, 'generarSugerenciasUpselling');
        const response = await callable({});
        return response.data;
    }

    // 2. Obtener TODAS las oportunidades (para el Widget Dashboard)
    // Se lee de manera segura para evitar errores de collectionGroup y de index
    getOportunidadesActivas(): Observable<OportunidadUpselling[]> {
        return from(this.fetchOportunidadesActivas());
    }

    private async fetchOportunidadesActivas(): Promise<OportunidadUpselling[]> {
        try {
            const tenantId = await this.authService.getTenantId();
            if (!tenantId) return [];

            // 1. Get clients
            const clientesRef = collection(this.firestore, 'clientes');
            const qClientes = query(clientesRef, where('tenantId', '==', tenantId));
            const clientesSnap = await getDocs(qClientes);

            if (clientesSnap.empty) return [];

            let allOps: OportunidadUpselling[] = [];

            // 2. Fetch opportunities for each client
            for (const clientDoc of clientesSnap.docs) {
                const opsRef = collection(this.firestore, `clientes/${clientDoc.id}/oportunidadesUpselling`);
                const qOps = query(opsRef, where('estado', '==', 'pendiente'));
                const opsSnap = await getDocs(qOps);

                opsSnap.forEach(opDoc => {
                    const clientData = clientDoc.data() as any;
                    const opData = opDoc.data() as any;
                    allOps.push({
                        id: opDoc.id,
                        nombreEmpresa: clientData['nombreEmpresa'] || 'Cliente',
                        ...opData
                    } as OportunidadUpselling);
                });
            }

            // 3. Sort locally by date descending
            allOps.sort((a, b) => {
                const dateA = a.fechaGeneracion?.toMillis?.() || 0;
                const dateB = b.fechaGeneracion?.toMillis?.() || 0;
                return dateB - dateA;
            });

            return allOps;
        } catch (e) {
            console.error('Error fetching oportunidades:', e);
            return [];
        }
    }

    // 3. Obtener oportunidades para UN SOLO cliente (para la Ficha de Cliente)
    getOportunidadesPorCliente(clienteId: string): Observable<OportunidadUpselling[]> {
        const opsRef = collection(this.firestore, `clientes/${clienteId}/oportunidadesUpselling`);
        const q = query(opsRef, where('estado', '==', 'pendiente'), orderBy('fechaGeneracion', 'desc'));
        return collectionData(q, { idField: 'id' }) as Observable<OportunidadUpselling[]>;
    }

    // 4. Actualizar estado de una oportunidad
    async actualizarEstadoOportunidad(clienteId: string, oportunidadId: string, nEstado: 'contactado' | 'descartado' | 'ganado'): Promise<void> {
        const docRef = doc(this.firestore, `clientes/${clienteId}/oportunidadesUpselling/${oportunidadId}`);
        await updateDoc(docRef, { estado: nEstado });
    }
}
