"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeDocument = void 0;
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const params_1 = require("firebase-functions/params");
const genai_1 = require("@google/genai");
const geminiApiKey = (0, params_1.defineSecret)("GEMINI_API_KEY");
/**
 * Endpoint para analizar un documento financiero (boleta, recibo, factura)
 * utilizando Gemini Flash y devolver una estructura tipada.
 */
exports.analyzeDocument = (0, https_1.onCall)({
    timeoutSeconds: 300,
    memory: "1GiB",
    secrets: [geminiApiKey]
}, async (request) => {
    // 1. Verify Authentication
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'The user must be authenticated to use LangExtract.');
    }
    const { fileBase64, mimeType } = request.data;
    if (!fileBase64 || !mimeType) {
        throw new https_1.HttpsError('invalid-argument', 'File Base64 data and mimeType are required.');
    }
    try {
        // Initialize Gemini using the official GenAI SDK
        const ai = new genai_1.GoogleGenAI({ apiKey: geminiApiKey.value() });
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
            if (!textResponse)
                throw new Error("Empty response from AI");
            const parsedJson = JSON.parse(textResponse);
            return parsedJson;
        }
        catch (e) {
            v2_1.logger.warn('Failed to parse straight JSON. Attempting regex extraction', textResponse);
            // Fallback: Use regex to extract JSON block if wrapped in markdown
            const jsonMatch = textResponse.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch && jsonMatch[1]) {
                return JSON.parse(jsonMatch[1]);
            }
            throw new Error('Gemini output was not valid JSON.');
        }
    }
    catch (error) {
        v2_1.logger.error('Error executing analyzeDocument with Gemini Flash:', error);
        throw new https_1.HttpsError('internal', 'Error processing document with AI', error);
    }
});
//# sourceMappingURL=analyzeDocument.js.map