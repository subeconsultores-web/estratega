import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { GoogleGenAI } from "@google/genai";

// Requieres configurar este secreto en tu proyecto Firebase via CLI:
// firebase functions:secrets:set GEMINI_API_KEY
const geminiApiKey = defineSecret("GEMINI_API_KEY");

export const askSubeIA = onCall({
    cors: true,
    secrets: [geminiApiKey]
}, async (request) => {
    // 1. Verificación de Autenticación
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'El usuario debe estar autenticado para usar SUBE IA.');
    }

    const { prompt, context, tenantId } = request.data;
    if (!prompt) {
        throw new HttpsError('invalid-argument', 'El mensaje (prompt) es requerido.');
    }

    try {
        // Inicializar Gemini usando la llave secreta
        const ai = new GoogleGenAI({
            apiKey: geminiApiKey.value()
        });

        // Instrucción Base del Sistema
        let systemInstruction = `Eres SUBE IA, la inteligencia artificial integrada en el CRM "Estratega Sube". 
        Tu objetivo es comportarte como un asistente proactivo, analítico y profesional.
        Ayudas a los equipos (administradores y representantes) y a los clientes a entender sus datos financieros, proyectos, estado de facturación, y resolver dudas.
        Debes responder en formato Markdown limpio, usando negritas, viñetas y saltos de línea donde corresponda para maximizar la legibilidad.
        
        [NUEVO COMPORTAMIENTO PARA GRÁFICOS]
        Si el usuario te solicita visualizar datos numéricos, comparar métricas, tendencias de ventas o pide explícitamente un gráfico ilustrativo, DEBES incluir en tu respuesta un bloque de código JSON marcado estrictamente con "json_chart".
        El JSON debe contener la estructura básica de Chart.js ({ type, data: { labels, datasets } }).
        Ejemplo:
        \`\`\`json_chart
        {
           "type": "bar",
           "data": { "labels": ["A", "B"], "datasets": [{ "label": "Datos", "data": [10, 20] }] }
        }
        \`\`\`
        Asegúrate de explicar brevemente el gráfico antes o después del bloque. Usa barras (bar), líneas (line) o donas (doughnut) según convenga.`;

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

    } catch (error: any) {
        console.error("Gemini API Error:", error);
        throw new HttpsError('internal', 'Ocurrió un error al contactar al cerebro de SUBE IA.', error.message);
    }
});
