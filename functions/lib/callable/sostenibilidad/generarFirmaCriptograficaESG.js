"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generarFirmaCriptograficaESG = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const crypto = require("crypto");
exports.generarFirmaCriptograficaESG = (0, https_1.onCall)(async (request) => {
    // 1. Verificación de Autenticación
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'El usuario debe estar autenticado para certificar documentos.');
    }
    const tenantId = request.auth.token['tenantId'];
    if (!tenantId) {
        throw new https_1.HttpsError('permission-denied', 'Token inválido. No se detectó Tenant.');
    }
    const { documentoId, tipoDocumento, metricasESG } = request.data;
    if (!documentoId || !tipoDocumento || !metricasESG) {
        throw new https_1.HttpsError('invalid-argument', 'Petición malformada. Faltan datos críticos para firmar.');
    }
    try {
        const payloadToSign = {
            t: tenantId,
            d: documentoId,
            k: tipoDocumento,
            m: metricasESG, // Ej: { huella: 1540, periodo: '01/2026' }
            s: 'SubeIA_Corp', // Semilla base
            ts: Date.now()
        };
        // 2. Generación del Hash Seguro (SHA-256)
        const payloadString = JSON.stringify(payloadToSign);
        const hash = crypto.createHash('sha256').update(payloadString).digest('hex');
        // 3. Persistir la firma pública en la bóveda de "Certificaciones ESG"
        const db = admin.firestore();
        const certificacionRef = db.collection('certificacionesESG').doc(hash);
        await certificacionRef.set({
            tenantId: tenantId,
            documentoFirmadoId: documentoId,
            tipoDocumento: tipoDocumento,
            hashPublico: hash,
            payloadOriginal: payloadToSign,
            fechaEmision: admin.firestore.FieldValue.serverTimestamp(),
            valido: true
        });
        // 4. Retornar el Hash seguro y la URL de validación pública
        const validationUrl = `https://app.subegestion.com/validate-signature/${hash}`;
        console.log(`[Certificación ESG] Hash generado para DOC ${documentoId}.`);
        return {
            success: true,
            hash: hash,
            validationUrl: validationUrl
        };
    }
    catch (error) {
        console.error('[Certificación ESG] Error encriptando payload:', error);
        throw new https_1.HttpsError('internal', 'Error criptográfico impidió generar firma.');
    }
});
//# sourceMappingURL=generarFirmaCriptograficaESG.js.map