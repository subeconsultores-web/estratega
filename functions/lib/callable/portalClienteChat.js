"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.portalClienteChat = void 0;
const admin = require("firebase-admin");
const https_1 = require("firebase-functions/v2/https");
const genai_1 = require("@google/genai");
const db = admin.firestore();
exports.portalClienteChat = (0, https_1.onCall)({
    cors: true,
    memory: '256MiB',
    maxInstances: 10
}, async (request) => {
    var _a, _b;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'El usuario debe estar autenticado.');
    }
    const { pregunta, clienteId, proyectoId } = request.data;
    if (!pregunta || !clienteId) {
        throw new https_1.HttpsError('invalid-argument', 'Se requiere pregunta y clienteId.');
    }
    try {
        // 1. Gather client context
        const clienteDoc = await db.collection('clientes').doc(clienteId).get();
        const clienteData = clienteDoc.exists ? clienteDoc.data() : {};
        // 2. Gather project context if available
        let proyectoContext = '';
        if (proyectoId) {
            const proyDoc = await db.collection('proyectos').doc(proyectoId).get();
            if (proyDoc.exists) {
                const p = proyDoc.data();
                proyectoContext = `Proyecto: "${p.nombre}", Estado: ${p.estado}, Horas presupuestadas: ${p.presupuestoHoras || 'N/A'}, Horas consumidas: ${p.horasConsumidas || 0}`;
            }
        }
        // 3. Gather recent cotizaciones for context
        let cotizacionesContext = '';
        const cotSnap = await db.collection('cotizaciones')
            .where('clienteId', '==', clienteId)
            .orderBy('createdAt', 'desc')
            .limit(3)
            .get();
        if (!cotSnap.empty) {
            cotizacionesContext = cotSnap.docs.map(d => {
                const c = d.data();
                return `- Cotización ${c.codigoFormateado || d.id}: $${c.totalFinal || 0}, Estado: ${c.estado}`;
            }).join('\n');
        }
        // 4. Gather recent facturas
        let facturasContext = '';
        const factSnap = await db.collection('facturas')
            .where('clienteId', '==', clienteId)
            .orderBy('createdAt', 'desc')
            .limit(3)
            .get();
        if (!factSnap.empty) {
            facturasContext = factSnap.docs.map(d => {
                const f = d.data();
                return `- Factura ${f.codigoFormateado || d.id}: $${f.total || 0}, Estado: ${f.estado}, Pendiente: $${f.montoPendiente || 0}`;
            }).join('\n');
        }
        // 5. Call Gemini with scoped context
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            throw new https_1.HttpsError('failed-precondition', 'API Key de Gemini no configurada.');
        }
        const ai = new genai_1.GoogleGenAI({ apiKey });
        const prompt = `Eres el asistente virtual del proyecto de un cliente en una agencia digital llamada "Sube".
Tu rol es responder preguntas del cliente usando SOLO la información proporcionada abajo. Si no tienes información suficiente, indica amablemente que el equipo del proyecto podrá responder con más detalle.

INFORMACIÓN DEL CLIENTE:
- Empresa: ${clienteData.nombreEmpresa || 'N/A'}
- Contacto: ${((_a = clienteData.contactoPrincipal) === null || _a === void 0 ? void 0 : _a.nombre) || 'N/A'}
- Estado: ${clienteData.estado || 'N/A'}

${proyectoContext ? `PROYECTO ACTIVO:\n${proyectoContext}` : ''}

${cotizacionesContext ? `COTIZACIONES RECIENTES:\n${cotizacionesContext}` : ''}

${facturasContext ? `FACTURAS RECIENTES:\n${facturasContext}` : ''}

PREGUNTA DEL CLIENTE:
"${pregunta}"

Responde de forma:
- Profesional y amable
- Concisa (máximo 2 párrafos)
- Basada solo en los datos disponibles
- Si no sabes algo, sugiere contactar al equipo asignado`;
        const result = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt
        });
        const respuesta = ((_b = result.text) === null || _b === void 0 ? void 0 : _b.trim()) || 'Disculpe, no pude procesar su consulta en este momento. Le recomiendo contactar directamente a su ejecutivo asignado.';
        return {
            success: true,
            data: { respuesta }
        };
    }
    catch (error) {
        console.error('Error en portal cliente chat IA:', error);
        if (error instanceof https_1.HttpsError)
            throw error;
        throw new https_1.HttpsError('internal', 'Error procesando la consulta.');
    }
});
//# sourceMappingURL=portalClienteChat.js.map