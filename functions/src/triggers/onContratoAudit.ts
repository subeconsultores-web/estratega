import * as admin from 'firebase-admin';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { generarHashAudit, generarHashGenesis } from '../utils/auditHash';

const db = admin.firestore();

/**
 * Trigger que se dispara en cada creación o modificación de un contrato.
 * Genera un hash criptográfico vinculante y lo guarda en la colección `audit_ledger`.
 */
export const onContratoAudit = onDocumentWritten(
    { document: 'contratos/{contratoId}', memory: '256MiB' },
    async (event) => {
        const afterData = event.data?.after?.data();
        if (!afterData) return;

        const contratoId = event.params.contratoId;
        const tipoEvento = event.data?.before?.exists ? 'MODIFICACION' : 'CREACION';

        try {
            const datosParaHash = {
                contratoId,
                clienteId: afterData.clienteId || '',
                cotizacionId: afterData.cotizacionId || '',
                estado: afterData.estado || '',
                tipoEvento,
                timestamp: new Date().toISOString()
            };

            const ultimoEvento = await db.collection('audit_ledger')
                .where('entidad', '==', 'contrato')
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
                entidad: 'contrato',
                entidadId: contratoId,
                tipoEvento,
                datosHash: datosParaHash,
                hashAnterior: hashAnterior || 'GENESIS',
                hash,
                secuencia,
                tenantId: afterData.tenantId || '',
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log(`✅ Audit ledger: Contrato ${contratoId} [${tipoEvento}] → Hash: ${hash.substring(0, 16)}...`);

        } catch (error) {
            console.error('Error en onContratoAudit:', error);
        }
    }
);
