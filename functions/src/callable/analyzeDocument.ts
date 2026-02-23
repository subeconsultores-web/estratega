import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { defineSecret } from 'firebase-functions/params';
import { GoogleGenAI } from '@google/genai';

const geminiApiKey = defineSecret("GEMINI_API_KEY");

/**
 * Endpoint para analizar un documento financiero (boleta, recibo, factura)
 * utilizando Gemini Flash y devolver una estructura tipada.
 */
export const analyzeDocument = onCall({
    timeoutSeconds: 300,
    memory: "1GiB",
    secrets: [geminiApiKey]
}, async (request) => {
    // 1. Verify Authentication
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'The user must be authenticated to use LangExtract.');
    }

    const { fileBase64, mimeType } = request.data;
    if (!fileBase64 || !mimeType) {
        throw new HttpsError('invalid-argument', 'File Base64 data and mimeType are required.');
    }

    try {
        // Initialize Gemini using the official GenAI SDK
        const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });

        // 2. Prepare the prompt instructing Gemini to act as a structured data extractor
        const prompt = `
            Eres un asistente contable (LangExtract) capaz de leer comprobantes, boletas o facturas.
            Analiza la imagen o PDF adjunto y extrae exactamente la siguiente información, devolviendo ÚNICAMENTE un JSON válido que coincida con este esquema:
            {
                "monto": <numero entero con el total a pagar o total general de la factura, sin simbolos>,
                "fecha": <fecha de emision en formato YYYY-MM-DD>,
                "proveedor": <nombre comercial de quien emite el recibo/factura>,
                "categoria": <clasifica el gasto en uno de estos valores exactos: "venta", "reembolso", "gasto_operativo", "salarios", "impuestos", "otros">,
                "notas": <breve descripcion resumida de que es la compra/ingreso>
            }

            Si no encuentras algun valor, déjalo como null o vacio, pero siempre responde en JSON estructurado.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                prompt,
                {
                    inlineData: {
                        data: fileBase64, // Must be pure base64 without data:image/png;base64, prefix
                        mimeType: mimeType
                    }
                }
            ],
            config: {
                responseMimeType: "application/json",
            }
        });

        const textResponse = response.text || '';

        // Safety parsing
        try {
            if (!textResponse) throw new Error("Empty response from AI");
            const parsedJson = JSON.parse(textResponse);
            return parsedJson;
        } catch (e) {
            logger.warn('Failed to parse straight JSON. Attempting regex extraction', textResponse);
            // Fallback: Use regex to extract JSON block if wrapped in markdown
            const jsonMatch = textResponse.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch && jsonMatch[1]) {
                return JSON.parse(jsonMatch[1]);
            }
            throw new Error('Gemini output was not valid JSON.');
        }

    } catch (error) {
        logger.error('Error executing analyzeDocument with Gemini Flash:', error);
        throw new HttpsError('internal', 'Error processing document with AI', error);
    }
});
