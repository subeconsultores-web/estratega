"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateZeroTrustAnomaly = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
/**
 * Firewall Evaluator: Evalúa un reporte de comportamiento anómalo (DDoS/Scraping masivo)
 * proveniente del frontend, y si se excede el umbral, instigará la revocación
 * inmediata de los tokens de sesión del usuario comprometido forzando un logout duro.
 */
exports.evaluateZeroTrustAnomaly = (0, https_1.onCall)({ region: 'us-central1' }, async (request) => {
    const auth = request.auth;
    // Si la llamada viene de un cliente sin autenticar o sin token válido, solo la registramos en logs pero no podemos revocar "nada".
    if (!auth || !auth.uid) {
        console.warn('Alerta Zero Trust recibida de cliente sin autenticación activa.');
        return { status: 'logged_unauthenticated' };
    }
    const uid = auth.uid;
    const { reason, count } = request.data || {};
    console.error(`🚨 [ZERO TRUST FIREWALL] Anomalía detectada y reportada para UID: ${uid}. Motivo: ${reason}. Peticiones registradas: ${count}`);
    try {
        // Ejecutar "Kill Switch"
        // revokeRefreshTokens invalida instantáneamente todos los refresh tokens asociados con el usuario.
        // Esto obliga al dispositivo a pedir nuevas credenciales re-autenticándose.
        await admin.auth().revokeRefreshTokens(uid);
        // Registro en base de datos para auditoría y dashboard del administrador del SaaS
        const db = admin.firestore();
        await db.collection('zero_trust_logs').add({
            uid: uid,
            tenantId: auth.token.tenantId || null,
            email: auth.token.email || 'unknown',
            reason: reason || 'UNKNOWN_ANOMALY',
            requestCount: count || 0,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            actionTaken: 'TOKENS_REVOKED',
            resolved: false
        });
        console.log(`Tokens revocados exitosamente para el UID: ${uid}. La sesión frontend expirará inmediatamente al revalidarse.`);
        return {
            status: 'tokens_revoked',
            message: 'Tu sesión ha sido revocada por razones de seguridad. Contacta al administrador si crees que esto es un error.'
        };
    }
    catch (error) {
        console.error('Error ejecutando protocolo preventivo (Revoke Access):', error);
        throw new https_1.HttpsError('internal', 'No se pudo aplicar la política Zero Trust en el Gateway', error.message);
    }
});
//# sourceMappingURL=evaluateZeroTrustAnomaly.js.map