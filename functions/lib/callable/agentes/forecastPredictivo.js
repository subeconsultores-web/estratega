"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.forecastPredictivo = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const genai_1 = require("@google/genai");
const params_1 = require("firebase-functions/params");
const geminiApiKey = (0, params_1.defineSecret)("GEMINI_API_KEY");
exports.forecastPredictivo = (0, https_1.onCall)({
    cors: true,
    secrets: [geminiApiKey]
}, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Autenticación requerida para usar Forecast IA.');
    }
    const { tenantId } = request.data;
    if (!tenantId) {
        throw new https_1.HttpsError('invalid-argument', 'El tenantId es requerido.');
    }
    try {
        const db = admin.firestore();
        // 1. Recolección de Datos Duros
        // a) Facturas Pendientes
        const facturasSnapshot = await db.collection('facturas')
            .where('tenantId', '==', tenantId)
            .where('estado', '==', 'pendiente')
            .get();
        let montoFacturasPendientes = 0;
        const facturasDetails = [];
        facturasSnapshot.forEach(doc => {
            var _a;
            const data = doc.data();
            montoFacturasPendientes += (data.total || 0);
            facturasDetails.push({ id: doc.id, total: data.total, fechaVencimiento: (_a = data.fechaVencimiento) === null || _a === void 0 ? void 0 : _a.toDate() });
        });
        // b) Cotizaciones en el Pipeline (No ganadas ni perdidas)
        // Se asume estado 'en_revision', 'enviada', 'borrador'
        const cotizacionesSnapshot = await db.collection('cotizaciones')
            .where('tenantId', '==', tenantId)
            .get();
        let montoPipeline = 0;
        const cotizacionesDetails = [];
        cotizacionesSnapshot.forEach(doc => {
            const data = doc.data();
            if (['enviada', 'en_revision', 'borrador', 'aprobada'].includes(data.estado)) {
                montoPipeline += (data.total || 0);
                cotizacionesDetails.push({ id: doc.id, total: data.total, estado: data.estado, clienteId: data.clienteId });
            }
        });
        // c) Contratos Activos (Ingresos Recurrentes)
        const contratosSnapshot = await db.collection('contratos')
            .where('tenantId', '==', tenantId)
            .where('estado', '==', 'activo')
            .get();
        let montoRecurrenteMensual = 0;
        contratosSnapshot.forEach(doc => {
            const data = doc.data();
            // Estimación simple si el contrato es mensual
            if (data.frecuenciaFacturacion === 'mensual') {
                montoRecurrenteMensual += (data.montoTotal || 0);
            }
        });
        // 2. Modelo de IA (Gemini) para análisis cualitativo y predicción final
        const ai = new genai_1.GoogleGenAI({
            apiKey: geminiApiKey.value()
        });
        const systemPrompt = `Eres el 'Forecast Manager AI' de Estratega Sube. 
Tu trabajo es analizar los datos comerciales actuales de una empresa y generar una predicción de ingresos a 90 días, identificando oportunidades y riesgos.

REGLAS:
1. Responde UNICAMENTE con un objeto JSON válido según la estructura dada. Sin formato Markdown alrededor.
2. Calcula los ingresos esperados para los próximos 3 meses sumando el pipeline probable, facturas pendientes (ajustadas por riesgo de no pago) y contratos recurrentes.
3. Genera 3 o 4 'alertas' proactivas informativas, de riesgo o de éxito.

ESTRUCTURA DE RESPUESTA:
{
  "prediccion90Dias": 0,
  "ingresoEsperadoMesActual": 0,
  "montoPipelinePonderado": 0,
  "confianza": "alta",
  "topDeals": [
    { "descripcion": "", "monto": 0 }
  ],
  "alertasIA": [
    { "tipo": "warning", "mensaje": "..." },
    { "tipo": "success", "mensaje": "..." }
  ]
}`;
        const userPrompt = `Analiza los siguientes datos comerciales de los próximos 90 días:
- Monto en Facturas Pendientes de cobro: $${montoFacturasPendientes} (Cantidad: ${facturasDetails.length})
- Monto en Pipeline (Cotizaciones activas): $${montoPipeline} (Cantidad: ${cotizacionesDetails.length})
- Ingreso Recurrente Base (Contratos mensuales activos): $${montoRecurrenteMensual}/mes

Resumen Cotizaciones en Pipeline:
${JSON.stringify(cotizacionesDetails.slice(0, 10))}

Genera el JSON de Forecast Predictivo.`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.2
            }
        });
        let responseText = (response.text || '{}').trim();
        if (responseText.startsWith('```json'))
            responseText = responseText.replace(/^```json/, '');
        if (responseText.startsWith('```'))
            responseText = responseText.replace(/^```/, '');
        if (responseText.endsWith('```'))
            responseText = responseText.replace(/```$/, '');
        const prediccionJSON = JSON.parse(responseText);
        // Devolvemos tanto los datos base como la predicción IA
        return {
            success: true,
            datosBase: {
                montoFacturasPendientes,
                montoPipeline,
                montoRecurrenteMensual
            },
            prediccionIA: prediccionJSON
        };
    }
    catch (error) {
        console.error("Error en Forecast Predictivo:", error);
        throw new https_1.HttpsError('internal', 'Error generando predictivo.', error.message);
    }
});
//# sourceMappingURL=forecastPredictivo.js.map