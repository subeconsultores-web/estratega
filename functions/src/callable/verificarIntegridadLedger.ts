import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { verificarHash } from '../utils/auditHash';

const db = admin.firestore();

/**
 * Verifica la integridad de toda la cadena de hashes del audit_ledger.
 * Recalcula cada hash y verifica que coincida con el almacenado.
 * Retorna un resumen de integridad por entidad.
 */
export const verificarIntegridadLedger = onCall({
    cors: true,
    memory: '512MiB',
    maxInstances: 5
}, async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Autenticación requerida.');
    }

    // Verificar que sea superadmin
    const role = request.auth.token['role'];
    if (role !== 'superadmin') {
        throw new HttpsError('permission-denied', 'Solo superadmins pueden verificar la integridad.');
    }

    try {
        const entidades = ['factura', 'contrato'];
        const resultados: Record<string, any> = {};

        for (const entidad of entidades) {
            const eventos = await db.collection('audit_ledger')
                .where('entidad', '==', entidad)
                .orderBy('secuencia', 'asc')
                .get();

            let totalEventos = 0;
            let eventosValidos = 0;
            let eventosTampereados = 0;
            const discrepancias: any[] = [];

            eventos.forEach(doc => {
                const data = doc.data();
                totalEventos++;

                const esValido = verificarHash(
                    data.datosHash,
                    data.hashAnterior,
                    data.hash
                );

                if (esValido) {
                    eventosValidos++;
                } else {
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

        const integridadGlobal = Object.values(resultados).every((r: any) => r.integridadOk);

        return {
            success: true,
            data: {
                integridadGlobal,
                resultados,
                verificadoEn: new Date().toISOString()
            }
        };

    } catch (error) {
        console.error('Error verificando integridad:', error);
        throw new HttpsError('internal', 'Error procesando la verificación de integridad.');
    }
});
