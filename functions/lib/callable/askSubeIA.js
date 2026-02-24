"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.askSubeIA = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const genai_1 = require("@google/genai");
const admin = require("firebase-admin");
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
        // 2. Definición de Herramientas (Tools)
        const tools = [{
                functionDeclarations: [
                    {
                        name: "get_metricas_financieras",
                        description: "Obtiene las métricas financieras clave actuales del negocio como ingresos del mes, cuentas por cobrar y MRR (Ingreso Mensual Recurrente). Usa esto cuando pregunten por dinero, facturación o ingresos.",
                        parameters: { type: genai_1.Type.OBJECT, properties: {} }
                    },
                    {
                        name: "get_resumen_clientes",
                        description: "Obtiene información resumida de la cartera de clientes, incluyendo cantidad de clientes activos.",
                        parameters: { type: genai_1.Type.OBJECT, properties: {} }
                    }
                ]
            }];
        // 3. Crear sesión de Chat para manejar turnos de herramientas
        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.4,
                tools: tools
            }
        });
        // 4. Invocar Modelo Generativo
        let response = await chat.sendMessage(prompt);
        // 5. Manejar Function Calling (si el modelo decide usar una herramienta)
        if (response.functionCalls && response.functionCalls.length > 0) {
            console.log("Gemini invocó herramientas:", response.functionCalls.map(f => f.name));
            const db = admin.firestore();
            const functionResponses = [];
            for (const call of response.functionCalls) {
                let callResult = { error: "Herramienta desconocida" };
                if (call.name === "get_metricas_financieras") {
                    try {
                        const mRef = db.collection('tenants').doc(tenantId || 'NO_TENANT').collection('metricas').doc('resumen_global');
                        const mSnap = await mRef.get();
                        if (mSnap.exists) {
                            callResult = mSnap.data();
                        }
                        else {
                            callResult = { ingresosMesActual: 1500000, porCobrar: 500000, mrr: 1000000, nota: "Datos mockeados por falta de documento." };
                        }
                    }
                    catch (e) {
                        callResult = { error: "No se pudo leer la base de datos de finanzas." };
                    }
                }
                if (call.name === "get_resumen_clientes") {
                    try {
                        const snap = await db.collection('clientes').where('tenantId', '==', tenantId || 'NO_TENANT').where('estado', '==', 'activo').count().get();
                        callResult = { clientesActivosTotales: snap.data().count };
                    }
                    catch (e) {
                        callResult = { error: "No se pudo leer la base de clientes." };
                    }
                }
                functionResponses.push({
                    functionResponse: {
                        name: call.name,
                        response: callResult
                    }
                });
            }
            // Enviar resultados de vuelta al modelo
            response = await chat.sendMessage({ message: functionResponses });
        }
        // 6. Devolver Respuesta Final
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