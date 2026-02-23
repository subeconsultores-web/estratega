"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.askSubeIA = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const genai_1 = require("@google/genai");
// Requieres configurar este secreto en tu proyecto Firebase via CLI:
// firebase functions:secrets:set GEMINI_API_KEY
const geminiApiKey = (0, params_1.defineSecret)("GEMINI_API_KEY");
exports.askSubeIA = (0, https_1.onCall)({
    cors: true,
    secrets: [geminiApiKey]
}, async (request) => {
    // 1. Verificación de Autenticación
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'El usuario debe estar autenticado para usar SUBE IA.');
    }
    const { prompt, context, tenantId } = request.data;
    if (!prompt) {
        throw new https_1.HttpsError('invalid-argument', 'El mensaje (prompt) es requerido.');
    }
    try {
        // Inicializar Gemini usando la llave secreta
        const ai = new genai_1.GoogleGenAI({
            apiKey: geminiApiKey.value()
        });
        // Instrucción Base del Sistema
        let systemInstruction = `Eres SUBE IA, la inteligencia artificial integrada en el CRM "Estratega Sube". 
        Tu objetivo es comportarte como un asistente proactivo, analítico y profesional.
        Ayudas a los equipos (administradores y representantes) y a los clientes a entender sus datos financieros, proyectos, estado de facturación, y resolver dudas.
        Debes responder en formato Markdown limpio, usando negritas, viñetas y saltos de línea donde corresponda para maximizar la legibilidad.`;
        // Inyectar contexto situacional provisto por el Frontend para guiar al modelo
        if (context) {
            systemInstruction += `\n\n[CONTEXTO ACTUAL DEL SISTEMA]\n${JSON.stringify(context)}`;
        }
        // Opcional: Podría inyectarse información del Tenant o Perfil del usuario consultando a Firestore aquí.
        if (tenantId) {
            systemInstruction += `\n[TENANT ID DE REFERENCIA]: ${tenantId}`;
        }
        // 2. Invocar Modelo Generativo
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.4, // Balance entre creatividad y precisión analítica
            }
        });
        // 3. Devolver Respuesta
        return {
            success: true,
            response: response.text
        };
    }
    catch (error) {
        console.error("Gemini API Error:", error);
        throw new https_1.HttpsError('internal', 'Ocurrió un error al contactar al cerebro de SUBE IA.', error.message);
    }
});
//# sourceMappingURL=askSubeIA.js.map