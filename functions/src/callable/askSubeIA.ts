import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { GoogleGenAI, Type } from "@google/genai";
import * as admin from "firebase-admin";

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

        // Instrucción Base del Sistema (Ajustada para Generative UI JSON)
        let systemInstruction = `Eres SUBE IA, la inteligencia artificial integrada en el CRM "Estratega Sube". 
        Tu objetivo es comportarte como un asistente proactivo, analítico y profesional.
        Ayudas a los equipos (administradores y representantes) y a los clientes a entender sus datos financieros, proyectos, estado de facturación, y resolver dudas.
        
        [REQUERIMIENTO ESTRICTO: GENERATIVE UI JSON]
        SIEMPRE debes retornar un objeto JSON estructurado, sin importar lo que pregunte el usuario.
        - Usa 'actionType' = 'MESSAGE' para respuestas conversacionales normales en formato Markdown.
        - Usa 'actionType' = 'CHART' para generar gráficos (bar, line, doughnut) cuando el usuario pida comparar métricas.
        - Usa 'actionType' = 'ACTION_PROMPT' si requieres que el usuario haga clic en un botón para confirmar una acción (ej. "Crear Cotización").
        `;

        // Inyectar contexto situacional provisto por el Frontend para guiar al modelo
        if (context) {
            systemInstruction += `\n\n[CONTEXTO ACTUAL DEL SISTEMA]\n${JSON.stringify(context)}`;
        }

        if (tenantId) {
            systemInstruction += `\n[TENANT ID DE REFERENCIA]: ${tenantId}`;
        }

        // Schema estricto que Gemini debe seguir al responder
        const subeIaResponseSchema = {
            type: Type.OBJECT,
            properties: {
                actionType: {
                    type: Type.STRING,
                    description: "El tipo de interfaz a renderizar en el frontend (MESSAGE, CHART, ACTION_PROMPT)"
                },
                message: {
                    type: Type.STRING,
                    description: "El texto descriptivo de la respuesta en formato Markdown limpio, usando negritas o viñetas."
                },
                chartData: {
                    type: Type.OBJECT,
                    description: "Opcional. Configuración de Chart.js si actionType es CHART. Debe incluir { type, data: { labels, datasets } }.",
                    properties: {
                        type: { type: Type.STRING },
                        data: {
                            type: Type.OBJECT,
                            properties: {
                                labels: { type: Type.ARRAY, items: { type: Type.STRING } },
                                datasets: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            label: { type: Type.STRING },
                                            data: { type: Type.ARRAY, items: { type: Type.NUMBER } }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                actionSuggested: {
                    type: Type.OBJECT,
                    description: "Opcional. Datos de la acción sugerida si actionType es ACTION_PROMPT.",
                    properties: {
                        actionId: { type: Type.STRING, description: "Identificador de la acción (ej. 'CREATE_INVOICE')" },
                        buttonLabel: { type: Type.STRING, description: "Texto del botón (ej. 'Generar Factura AHORA')" },
                        payload: { type: Type.OBJECT, description: "Datos pre-configurados para ejecutar la acción." }
                    }
                }
            },
            required: ["actionType", "message"]
        };

        // 2. Definición de Herramientas (Tools)
        const tools = [{
            functionDeclarations: [
                {
                    name: "get_metricas_financieras",
                    description: "Obtiene las métricas financieras clave actuales del negocio como ingresos del mes, cuentas por cobrar y MRR (Ingreso Mensual Recurrente).",
                    // Dejamos properties vacías temporalmente o definimos un objecto genérico
                },
                {
                    name: "get_resumen_clientes",
                    description: "Obtiene información resumida de la cartera de clientes, incluyendo cantidad de clientes activos.",
                }
            ]
        }];

        // 3. Crear sesión de Chat para manejar turnos de herramientas y Schema Estricto
        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.2, // Reducida para asegurar precisión en JSON structures
                responseMimeType: "application/json",
                responseSchema: subeIaResponseSchema,
                tools: tools
            }
        });

        // 4. Invocar Modelo Generativo
        let response = await chat.sendMessage(prompt);

        // 5. Manejar Function Calling (si el modelo decide usar una herramienta)
        if (response.functionCalls && response.functionCalls.length > 0) {
            console.log("Gemini invocó herramientas:", response.functionCalls.map(f => f.name));

            const db = admin.firestore();
            const functionResponses: any[] = [];

            for (const call of response.functionCalls) {
                let callResult: any = { error: "Herramienta desconocida" };

                if (call.name === "get_metricas_financieras") {
                    try {
                        const mRef = db.collection('tenants').doc(tenantId || 'NO_TENANT').collection('metricas').doc('resumen_global');
                        const mSnap = await mRef.get();
                        if (mSnap.exists) {
                            callResult = mSnap.data();
                        } else {
                            callResult = { ingresosMesActual: 1500000, porCobrar: 500000, mrr: 1000000, nota: "Datos mockeados por falta de documento." };
                        }
                    } catch (e) {
                        callResult = { error: "No se pudo leer la base de datos de finanzas." };
                    }
                }

                if (call.name === "get_resumen_clientes") {
                    try {
                        const snap = await db.collection('clientes').where('tenantId', '==', tenantId || 'NO_TENANT').where('estado', '==', 'activo').count().get();
                        callResult = { clientesActivosTotales: snap.data().count };
                    } catch (e) {
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

            // Enviar resultados de vuelta al modelo para que genere el JSON Final
            response = await chat.sendMessage({ message: functionResponses });
        }

        // 6. Parsear y Devolver Respuesta Estructurada
        let jsonPayload;
        try {
            // response.text ya debería venir en string JSON gracias a responseMimeType
            jsonPayload = JSON.parse(response.text || "{}");
        } catch (parseError) {
            console.error("No se pudo parsear la respuesta JSON de Gemini:", parseError);
            // Fallback de seguridad en caso de alucinación fuera de formato
            jsonPayload = {
                actionType: 'MESSAGE',
                message: "Lo siento, tuve un problema interno estructurando mi respuesta gráfica. " + response.text
            };
        }

        return {
            success: true,
            data: jsonPayload // Devolvemos el JSON validado directamente en .data
        };

    } catch (error: any) {
        console.error("Gemini API Error:", error);
        throw new HttpsError('internal', 'Ocurrió un error al contactar al cerebro de SUBE IA.', error.message);
    }
});
