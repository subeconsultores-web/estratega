"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generarSugerenciasUpselling = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const genai_1 = require("@google/genai");
const params_1 = require("firebase-functions/params");
const geminiApiKey = (0, params_1.defineSecret)("GEMINI_API_KEY");
// Analiza los clientes recurrentes o de alto valor de un Tenant y sugiere upselling
exports.generarSugerenciasUpselling = (0, https_1.onCall)({
    secrets: [geminiApiKey]
}, async (request) => {
    var _a;
    // 1. Verificación de Autenticación
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'El usuario debe estar autenticado para generar sugerencias.');
    }
    const tenantId = request.auth.token.tenantId;
    if (!tenantId) {
        throw new https_1.HttpsError('permission-denied', 'El usuario no tiene un tenantId asignado.');
    }
    try {
        const db = admin.firestore();
        const ai = new genai_1.GoogleGenAI({ apiKey: geminiApiKey.value() });
        console.log(`Buscando clientes activos para Upselling en Tenant: ${tenantId}`);
        // 2. Obtener lista de servicios o productos del tenant (para saber qué podemos ofrecer)
        // Por simplicidad, asumimos un catálogo estático o extraído de una colección 'servicios'
        const serviciosSnapshot = await db.collection('tenants').doc(tenantId).collection('configuracion').doc('servicios').get();
        let serviciosOfertables = "Desarrollo Web, Gestión de Redes Sociales, Consultoría Comercial, Implementación de CRM, SEO y SEM.";
        if (serviciosSnapshot.exists) {
            const data = serviciosSnapshot.data();
            if (data && data.catalogo) {
                // Suponiendo un array de strings o de objetos
                if (Array.isArray(data.catalogo)) {
                    serviciosOfertables = data.catalogo.map(s => typeof s === 'string' ? s : s.nombre).join(', ');
                }
            }
        }
        // 3. Traer los clientes del tenant (priorizamos los Activos)
        const clientesRef = db.collection('clientes').where('tenantId', '==', tenantId).where('estado', '==', 'activo');
        const snapshot = await clientesRef.limit(10).get(); // Limitamos a 10 para probar en Callable (podría ser un cron job para toda la base)
        if (snapshot.empty) {
            return { success: true, message: "No hay suficientes clientes activos para analizar oportunidades de upselling." };
        }
        const clientesData = snapshot.docs.map(doc => ({
            id: doc.id,
            nombreEmpresa: doc.data().nombreEmpresa || 'Desconocido',
            giro: doc.data().giro || 'No especificado',
            serviciosActuales: doc.data().serviciosContratados || [], // Asumiendo que pueden guardar esto
            valorEstimado: doc.data().valorEstimado || 0
        }));
        console.log(`Se analizarán ${clientesData.length} clientes usando Gemini...`);
        // 4. Construir el Prompt masivo para la IA
        const systemPrompt = `Eres un talentoso gerente de cuentas B2B (Key Account Manager).
Tu objetivo es analizar un lote de clientes y sugerir una oportunidad lógica de Venta Cruzada (Cross-selling) o Upselling (mejora de plan) para cada cliente.

SERVICIOS QUE PODEMOS OFRECER: ${serviciosOfertables}

Debes responder exclusivamente en formato JSON estricto con la siguiente estructura:
{
  "sugerencias": [
    {
      "clienteId": "id-del-cliente",
      "servicioSugerido": "Nombre del servicio a ofrecer",
      "razonComercial": "Una justificación de 2 oraciones de por qué este cliente necesita este servicio según su giro o estado actual",
      "probabilidadXito": "Alta, Media o Baja"
    }
  ]
}
No incluyas markdown, código, ni texto adicional. Solo el JSON válido.`;
        const userPrompt = `Aquí están los clientes a analizar:\n${JSON.stringify(clientesData, null, 2)}`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.3, // Baja temperatura para análisis lógico JSON
            }
        });
        let jsonRaw = ((_a = response.text) === null || _a === void 0 ? void 0 : _a.trim()) || '{"sugerencias": []}';
        if (jsonRaw.startsWith('```json'))
            jsonRaw = jsonRaw.replace(/^```json\\n?/, '');
        if (jsonRaw.startsWith('```'))
            jsonRaw = jsonRaw.replace(/^```\\n?/, '');
        if (jsonRaw.endsWith('```'))
            jsonRaw = jsonRaw.replace(/\\n?```$/, '');
        const upsellingResult = JSON.parse(jsonRaw);
        // 5. Guardar en Firestore cada sugerencia encontrada
        let generados = 0;
        if (upsellingResult.sugerencias && Array.isArray(upsellingResult.sugerencias)) {
            const batch = db.batch();
            for (const sugerencia of upsellingResult.sugerencias) {
                // Guardar como macro subcolección o en el perfil de cliente (clientes/id/upsellings)
                if (sugerencia.clienteId) {
                    const opRef = db.collection('clientes').doc(sugerencia.clienteId).collection('oportunidadesUpselling').doc();
                    batch.set(opRef, Object.assign(Object.assign({}, sugerencia), { fechaGeneracion: admin.firestore.FieldValue.serverTimestamp(), estado: 'pendiente' // pendiente, contactado, descartado, ganado
                     }));
                    generados++;
                }
            }
            await batch.commit();
        }
        return {
            success: true,
            message: `Se generaron y guardaron ${generados} oportunidades de Upselling.`,
            detalles: upsellingResult.sugerencias
        };
    }
    catch (error) {
        console.error("Error en generarSugerenciasUpselling:", error);
        throw new https_1.HttpsError('internal', 'Ocurrió un error al generar oportunidades médicas/comerciales de IA.');
    }
});
//# sourceMappingURL=generarSugerenciasUpselling.js.map