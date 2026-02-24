import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Firestore, collection, query, collectionGroup, where, orderBy, doc, updateDoc, collectionData } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';

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

    // 1. Llamar a Gemini para escanear la base y generar sugerencias
    async generarSugerencias(): Promise<any> {
        const callable = httpsCallable(this.functions, 'generarSugerenciasUpselling');
        const response = await callable({});
        return response.data;
    }

    // 2. Obtener TODAS las oportunidades (para el Widget Dashboard) - Usando Collection Group o filtrando por tenantId si estuviera en la op
    // Por simplicidad, leeremos de los clientes. Como `oportunidadesUpselling` es subcolección de `clientes`, 
    // lo ideal sería usar collectionGroup y filtrar por estado='pendiente'.
    // Requiere índice compuesto en Firestore si filtramos por múltiples cosas.
    getOportunidadesActivas(): Observable<OportunidadUpselling[]> {
        // TEMPORARY MITIGATION: collectionGroup with injected this.firestore
        // behaves inconsistently returning "Type does not match instance" possibly due to
        // esbuild importing different firebase bundles.
        // Returning [] meanwhile to unblock production dashboard.
        // const opsRef = collectionGroup(this.firestore, 'oportunidadesUpselling');
        // const q = query(opsRef, where('estado', '==', 'pendiente'), orderBy('fechaGeneracion', 'desc'));
        // return collectionData(q, { idField: 'id' }) as Observable<OportunidadUpselling[]>;

        return of([]);
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
