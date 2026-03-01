"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onContratoAudit = void 0;
const admin = require("firebase-admin");
const firestore_1 = require("firebase-functions/v2/firestore");
const auditHash_1 = require("../utils/auditHash");
const db = admin.firestore();
/**
 * Trigger que se dispara en cada creación o modificación de un contrato.
 * Genera un hash criptográfico vinculante y lo guarda en la colección `audit_ledger`.
 */
exports.onContratoAudit = (0, firestore_1.onDocumentWritten)({ document: 'contratos/{contratoId}', memory: '256MiB' }, async (event) => {
    var _a, _b, _c, _d;
    const afterData = (_b = (_a = event.data) === null || _a === void 0 ? void 0 : _a.after) === null || _b === void 0 ? void 0 : _b.data();
    if (!afterData)
        return;
    const contratoId = event.params.contratoId;
    const tipoEvento = ((_d = (_c = event.data) === null || _c === void 0 ? void 0 : _c.before) === null || _d === void 0 ? void 0 : _d.exists) ? 'MODIFICACION' : 'CREACION';
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
            ? (0, auditHash_1.generarHashAudit)(datosParaHash, hashAnterior)
            : (0, auditHash_1.generarHashGenesis)(datosParaHash);
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
    }
    catch (error) {
        console.error('Error en onContratoAudit:', error);
    }
});
//# sourceMappingURL=onContratoAudit.js.map