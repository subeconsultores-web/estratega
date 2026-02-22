"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStripeCheckout = void 0;
const functions = require("firebase-functions/v2");
const admin = require("firebase-admin");
/**
 * Callable function base para delegar el pago de facturas a Stripe
 * Nota: Requiere configuración de secret key de Stripe en environment
 */
exports.createStripeCheckout = functions.https.onCall(async (request) => {
    // Validar Auth
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const { facturaId, returnUrl } = request.data;
    if (!facturaId) {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a valid facturaId.');
    }
    try {
        console.log(`Iniciando checkout session para factura ${facturaId}`);
        // Inicializar Firestore DB
        const db = admin.firestore();
        const facturaRef = db.collection('facturas').doc(facturaId);
        const facturaDoc = await facturaRef.get();
        if (!facturaDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'La factura solicitada no existe.');
        }
        const facturaInfo = facturaDoc.data();
        // --- SKELETON STRIPE INTEGRATION ---
        // Se preserva el skeleton en los records
        // Retornamos un Mock para Fase 12
        return {
            success: true,
            url: `https://checkout.stripe.com/c/pay/mock_session_id_${facturaId}`,
            message: 'Checkout Session generada exitosamente (MOCK)',
            debug_info: {
                tenantId: facturaInfo === null || facturaInfo === void 0 ? void 0 : facturaInfo['tenantId'],
                returnUrl_requested: returnUrl
            }
        };
    }
    catch (error) {
        console.error('Error generando Stripe Checkout Session:', error);
        throw new functions.https.HttpsError('internal', 'No se pudo iniciar el proceso de pago.', error);
    }
});
//# sourceMappingURL=createStripeCheckout.js.map