import * as admin from 'firebase-admin';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { generarHashAudit, generarHashGenesis } from '../utils/auditHash';

const db = admin.firestore();

/**
 * Trigger que se dispara en cada creación o modificación de una factura.
 * Genera un hash criptográfico vinculante y lo guarda en la colección `audit_ledger`.
 */
export const onFacturaAudit = onDocumentWritten(
    { document: 'facturas/{facturaId}', memory: '256MiB' },
    async (event) => {
        const afterData = event.data?.after?.data();
        if (!afterData) return; // Documento borrado, no auditamos deletes aquí

        const facturaId = event.params.facturaId;
        const tipoEvento = event.data?.before?.exists ? 'MODIFICACION' : 'CREACION';

        try {
            // Datos relevantes para el hash (excluir campos volátiles)
            const datosParaHash = {
                facturaId,
                clienteId: afterData.clienteId || '',
                total: afterData.total || 0,
                estado: afterData.estado || '',
                montoPendiente: afterData.montoPendiente || 0,
                tipoEvento,
                timestamp: new Date().toISOString()
            };

            // Obtener el hash anterior de la cadena
            const ultimoEvento = await db.collection('audit_ledger')
                .where('entidad', '==', 'factura')
                .orderBy('secuencia', 'desc')
                .limit(1)
                .get();

            let hashAnterior = '';
            let secuencia = 1;

            if (!ultimoEvento.empty) {
                const ultimo = ultimoEvento.docs[0].data();
                hashAnterior = ultimo.hash;
                secuencia = (ultimo.secuencia || 0) + 1;
            }

            const hash = hashAnterior
                ? generarHashAudit(datosParaHash, hashAnterior)
                : generarHashGenesis(datosParaHash);

            await db.collection('audit_ledger').add({
                entidad: 'factura',
                entidadId: facturaId,
                tipoEvento,
                datosHash: datosParaHash,
                hashAnterior: hashAnterior || 'GENESIS',
                hash,
                secuencia,
                tenantId: afterData.tenantId || '',
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log(`✅ Audit ledger: Factura ${facturaId} [${tipoEvento}] → Hash: ${hash.substring(0, 16)}...`);

        } catch (error) {
            console.error('Error en onFacturaAudit:', error);
        }
    }
);
