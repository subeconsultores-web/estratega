import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { GoogleGenAI } from '@google/genai';

const db = admin.firestore();

export const sugerirRespuestaIA = onCall({
    cors: true,
    memory: '256MiB',
    maxInstances: 10
}, async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'El usuario debe estar autenticado.');
    }

    const tenantId = request.auth.token['tenantId'];
    if (!tenantId) {
        throw new HttpsError('permission-denied', 'No se encontró tenantId.');
    }

    const { conversacionId } = request.data;
    if (!conversacionId) {
        throw new HttpsError('invalid-argument', 'Se requiere conversacionId.');
    }

    try {
        // 1. Get conversation details
        const convDoc = await db.collection('conversaciones').doc(conversacionId).get();
        if (!convDoc.exists) {
            throw new HttpsError('not-found', 'La conversación no existe.');
        }
        const conv = convDoc.data()!;

        // 2. Get recent messages (last 20)
        const mensajesSnap = await db.collection('mensajes')
            .where('conversacionId', '==', conversacionId)
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();

        const historial = mensajesSnap.docs.reverse().map(doc => {
            const m = doc.data();
            return `[${m.autorTipo === 'interno' ? 'Agente' : 'Cliente'}] ${m.autorNombre}: ${m.contenido}`;
        }).join('\n');

        // 3. Get client context
        let contextoCliente = '';
        if (conv.clienteId) {
            const clienteDoc = await db.collection('clientes').doc(conv.clienteId).get();
            if (clienteDoc.exists) {
                const c = clienteDoc.data()!;
                contextoCliente = `Cliente: ${c.nombreEmpresa || c.contactoPrincipal?.nombre || 'Desconocido'}, Estado: ${c.estado}, Sector: ${c.giro || 'N/A'}`;
            }
        }

        // 4. Call Gemini
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            throw new HttpsError('failed-precondition', 'API Key de Gemini no configurada.');
        }

        const ai = new GoogleGenAI({ apiKey });

        const prompt = `Eres un asistente de ventas profesional de una agencia digital.
Tu trabajo es sugerir UNA respuesta ideal para el agente interno, basada en el historial del chat y el contexto del cliente.

Contexto del Cliente: ${contextoCliente}
Asunto de la conversación: ${conv.asunto || 'General'}

Historial reciente del chat:
${historial}

Genera UNA respuesta profesional, cálida y orientada a la acción que el agente podría enviar al cliente.
- Máximo 3 párrafos cortos.
- Tono: profesional pero cercano.
- Si hay un problema, ofrece solución concreta.
- Si hay oportunidad de venta, menciónala sutilmente.

Responde SOLO con el texto sugerido, sin comillas ni prefijos.`;

        const result = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt
        });

        const respuestaSugerida = result.text?.trim() || 'No se pudo generar una sugerencia en este momento.';

        return {
            success: true,
            data: {
                respuestaSugerida,
                contextoCliente
            }
        };

    } catch (error: any) {
        console.error('Error generando sugerencia IA:', error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError('internal', 'Error procesando la sugerencia IA.');
    }
});
