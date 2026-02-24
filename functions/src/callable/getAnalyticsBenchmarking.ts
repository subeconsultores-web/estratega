import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { BigQuery } from '@google-cloud/bigquery';

const bigquery = new BigQuery();

export const getAnalyticsBenchmarking = onCall({ region: 'us-central1' }, async (request) => {
    const auth = request.auth;
    if (!auth || !auth.uid) {
        throw new HttpsError('unauthenticated', 'El usuario no está autenticado');
    }

    const tenantId = auth.token.tenantId;

    if (!tenantId) {
        throw new HttpsError('failed-precondition', 'El usuario no tiene un tenantId asignado');
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

    } catch (error: any) {
        console.error('Error al consultar BigQuery (Es posible que las Vistas BQ no existan aún):', error);
        throw new HttpsError('internal', 'Error al procesar la analítica de BigQuery: ' + error.message);
    }
});
