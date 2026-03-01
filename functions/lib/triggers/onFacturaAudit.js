"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onFacturaAudit = void 0;
const admin = require("firebase-admin");
const firestore_1 = require("firebase-functions/v2/firestore");
const auditHash_1 = require("../utils/auditHash");
const db = admin.firestore();
/**
 * Trigger que se dispara en cada creación o modificación de una factura.
 * Genera un hash criptográfico vinculante y lo guarda en la colección `audit_ledger`.
 */
exports.onFacturaAudit = (0, firestore_1.onDocumentWritten)({ document: 'facturas/{facturaId}', memory: '256MiB' }, async (event) => {
    var _a, _b, _c, _d;
    const afterData = (_b = (_a = event.data) === null || _a === void 0 ? void 0 : _a.after) === null || _b === void 0 ? void 0 : _b.data();
    if (!afterData)
        return; // Documento borrado, no auditamos deletes aquí
    const facturaId = event.params.facturaId;
    const tipoEvento = ((_d = (_c = event.data) === null || _c === void 0 ? void 0 : _c.before) === null || _d === void 0 ? void 0 : _d.exists) ? 'MODIFICACION' : 'CREACION';
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
            ? (0, auditHash_1.generarHashAudit)(datosParaHash, hashAnterior)
            : (0, auditHash_1.generarHashGenesis)(datosParaHash);
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
    }
    catch (error) {
        console.error('Error en onFacturaAudit:', error);
    }
});
//# sourceMappingURL=onFacturaAudit.js.map