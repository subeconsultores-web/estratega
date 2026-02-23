import { inject, Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Functions, httpsCallable } from '@angular/fire/functions';

export interface ExtractedTransactionData {
    monto?: number;
    fecha?: string;
    categoria?: string;
    proveedor?: string;
    notas?: string;
}

@Injectable({
    providedIn: 'root'
})
export class SubeIaExtractService {
    private functions = inject(Functions);
    private auth = inject(Auth);

    /**
     * Envia un archivo en base64 a la Cloud Function para que Gemini Vision lo analice
     * y extraiga datos financieros estructurados.
     * @param base64File El archivo codificado en Base64 con su prefijo data URI (ej: data:image/png;base64,...)
     * @param mimeType El mimetype del archivo
     * @returns Datos estructurados
     */
    async extractTransactionData(base64File: string, mimeType: string): Promise<ExtractedTransactionData> {
        try {
            // Strip the data URL prefix before sending if it exists
            const base64Data = base64File.includes(',') ? base64File.split(',')[1] : base64File;

            const extractFn = httpsCallable<{ fileBase64: string, mimeType: string }, ExtractedTransactionData>(
                this.functions,
                'analyzeDocument'
            );

            const result = await extractFn({ fileBase64: base64Data, mimeType });
            return result.data;
        } catch (error) {
            console.error('Error in SubeIaExtractService:', error);
            throw new Error('No se pudo analizar el documento con IA.');
        }
    }
}
