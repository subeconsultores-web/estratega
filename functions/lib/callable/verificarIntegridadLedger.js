"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificarIntegridadLedger = void 0;
const admin = require("firebase-admin");
const https_1 = require("firebase-functions/v2/https");
const auditHash_1 = require("../utils/auditHash");
const db = admin.firestore();
/**
 * Verifica la integridad de toda la cadena de hashes del audit_ledger.
 * Recalcula cada hash y verifica que coincida con el almacenado.
 * Retorna un resumen de integridad por entidad.
 */
exports.verificarIntegridadLedger = (0, https_1.onCall)({
    cors: true,
    memory: '512MiB',
    maxInstances: 5
}, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Autenticación requerida.');
    }
    // Verificar que sea superadmin
    const role = request.auth.token['role'];
    if (role !== 'superadmin') {
        throw new https_1.HttpsError('permission-denied', 'Solo superadmins pueden verificar la integridad.');
    }
    try {
        const entidades = ['factura', 'contrato'];
        const resultados = {};
        for (const entidad of entidades) {
            const eventos = await db.collection('audit_ledger')
                .where('entidad', '==', entidad)
                .orderBy('secuencia', 'asc')
                .get();
            let totalEventos = 0;
            let eventosValidos = 0;
            let eventosTampereados = 0;
            const discrepancias = [];
            eventos.forEach(doc => {
                const data = doc.data();
                totalEventos++;
                const esValido = (0, auditHash_1.verificarHash)(data.datosHash, data.hashAnterior, data.hash);
                if (esValido) {
                    eventosValidos++;
                }
                else {
                    eventosTampereados++;
                    discrepancias.push({
                        docId: doc.id,
                        entidadId: data.entidadId,
                        secuencia: data.secuencia,
                        tipoEvento: data.tipoEvento
                    });
                }
            });
            resultados[entidad] = {
                totalEventos,
                eventosValidos,
                eventosTampereados,
                integridadOk: eventosTampereados === 0,
                discrepancias: discrepancias.slice(0, 10) // Limitar a 10
            };
        }
        const integridadGlobal = Object.values(resultados).every((r) => r.integridadOk);
        return {
            success: true,
            data: {
                integridadGlobal,
                resultados,
                verificadoEn: new Date().toISOString()
            }
        };
    }
    catch (error) {
        console.error('Error verificando integridad:', error);
        throw new https_1.HttpsError('internal', 'Error procesando la verificación de integridad.');
    }
});
//# sourceMappingURL=verificarIntegridadLedger.js.map