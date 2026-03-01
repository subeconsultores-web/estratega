"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnalyticsBenchmarking = void 0;
const https_1 = require("firebase-functions/v2/https");
const bigquery_1 = require("@google-cloud/bigquery");
const bigquery = new bigquery_1.BigQuery();
exports.getAnalyticsBenchmarking = (0, https_1.onCall)({ region: 'us-central1' }, async (request) => {
    const auth = request.auth;
    if (!auth || !auth.uid) {
        throw new https_1.HttpsError('unauthenticated', 'El usuario no está autenticado');
    }
    const tenantId = auth.token.tenantId;
    if (!tenantId) {
        throw new https_1.HttpsError('failed-precondition', 'El usuario no tiene un tenantId asignado');
    }
    try {
        // Query de Proyectos Analítica BQ
        const queryProyectos = `
            SELECT 
                COUNT(*) as total_proyectos,
                SUM(horas_estimadas) as total_horas_estimadas,
                SUM(horas_reales) as total_horas_reales,
                SUM(presupuesto) as presupuesto_total,
                SUM(monto_facturado) as facturado_total,
                COUNTIF(en_riesgo = true) as proyectos_en_riesgo
            FROM \`firestore_export.vw_estado_proyectos\`
            WHERE tenant_id = @tenantId
        `;
        const [rowsProyectos] = await bigquery.query({
            query: queryProyectos,
            params: { tenantId: tenantId }
        });
        // Query de Flujo de Caja BQ
        const queryCaja = `
            SELECT 
                COUNT(*) as total_facturas,
                SUM(monto_total) as flujo_total,
                COUNTIF(estado = 'pagada') as facturas_pagadas,
                SUM(CASE WHEN estado = 'pagada' THEN monto_total ELSE 0 END) as ingresos_reales
            FROM \`firestore_export.vw_flujo_caja\`
            WHERE tenant_id = @tenantId
        `;
        const [rowsCaja] = await bigquery.query({
            query: queryCaja,
            params: { tenantId: tenantId }
        });
        return {
            status: 'success',
            proyectos: rowsProyectos.length > 0 ? rowsProyectos[0] : null,
            caja: rowsCaja.length > 0 ? rowsCaja[0] : null
        };
    }
    catch (error) {
        console.error('Error al consultar BigQuery (Es posible que las Vistas BQ no existan aún):', error);
        throw new https_1.HttpsError('internal', 'Error al procesar la analítica de BigQuery: ' + error.message);
    }
});
//# sourceMappingURL=getAnalyticsBenchmarking.js.map