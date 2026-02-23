import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';

export interface GenerarPropuestaPayload {
    clienteId: string;
    serviciosOfrecidos: { nombre: string; precio: string | number }[];
    tono?: 'formal' | 'agresivo' | 'breve' | 'casual';
    contextoExtra?: string;
}

export interface GenerarPropuestaResponse {
    success: boolean;
    propuesta: string;
}

@Injectable({
    providedIn: 'root'
})
export class PropuestasIAService {
    private functions = inject(Functions);

    async generarPropuesta(payload: GenerarPropuestaPayload): Promise<string> {
        const callable = httpsCallable<GenerarPropuestaPayload, GenerarPropuestaResponse>(this.functions, 'generarPropuestaIA');
        const response = await callable(payload);

        if (response.data && response.data.success) {
            return response.data.propuesta;
        } else {
            throw new Error('No se recibió la propuesta esperada.');
        }
    }
}
