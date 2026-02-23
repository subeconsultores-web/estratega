"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhook = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const stripe_1 = require("stripe");
const stripe = new stripe_1.default(process.env['STRIPE_SECRET_KEY'] || 'sk_test_something', {
    apiVersion: '2025-01-27.acacia',
});
const endpointSecret = process.env['STRIPE_WEBHOOK_SECRET'] || 'whsec_test';
exports.stripeWebhook = (0, https_1.onRequest)(async (req, res) => {
    var _a, _b, _c;
    // Stripe HTTP callbacks attach strict symmetric encrypted headers mapped 'stripe-signature'
    const sig = req.headers['stripe-signature'];
    if (!sig) {
        console.warn('Webhook called with no Stripe Signature present in HttpHeader');
        res.status(400).send('No signature found');
        return;
    }
    let event;
    try {
        // Validation occurs against rawBody buffer injection specifically to negate arbitrary object replacements 
        event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
    }
    catch (err) {
        console.error(`Webhook cryptographic signature verification validation failed: ${err.message}`);
        res.status(400).send(`Webhook Validation Error: ${err.message}`);
        return;
    }
    // Process secure lifecycle pipeline mapped from Stripe
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        // Extract metadata bridging correlation bindings stored earlier in 'createCheckoutSession'
        const facturaId = (_a = session.metadata) === null || _a === void 0 ? void 0 : _a['facturaId'];
        const tenantId = (_b = session.metadata) === null || _b === void 0 ? void 0 : _b['tenantId'];
        const paymentIntentId = session.payment_intent;
        if (facturaId && tenantId) {
            const db = admin.firestore();
            try {
                const amountPagado = session.amount_total ? (session.currency === 'clp' ? session.amount_total : session.amount_total / 100) : 0;
                // Write atomic batch update for both Factura and Transaccion
                const batch = db.batch();
                // 1. Update Factura
                const facturaRef = db.doc(`facturas/${facturaId}`);
                batch.update(facturaRef, {
                    estado: 'pagada',
                    stripePaymentIntentId: paymentIntentId,
                    montoPagado: amountPagado,
                    saldoPendiente: 0,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                // 2. Automate Transaccion (Ingreso)
                const transaccionRef = db.collection('transacciones').doc();
                batch.set(transaccionRef, {
                    tenantId: tenantId,
                    monto: amountPagado,
                    moneda: ((_c = session.currency) === null || _c === void 0 ? void 0 : _c.toUpperCase()) || 'CLP',
                    tipo: 'ingreso',
                    categoria: 'venta',
                    metodoPago: 'stripe',
                    estado: 'completado',
                    fecha: admin.firestore.FieldValue.serverTimestamp(),
                    referenciaExterna: paymentIntentId,
                    notas: `Pago automático de Factura Ext. Ref: ${facturaId}`,
                    creadoPor: 'SYSTEM_WEBHOOK',
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
                await batch.commit();
                console.log(`[Success] Factura ${facturaId} marked as pagada. Auto-Transaccion recorded via Stripe Webhook.`);
            }
            catch (error) {
                console.error('Fatal execution hook while persisting database metadata on Webhook arrival!', error);
            }
        }
        else {
            console.warn('Stripe Checkout process completed externally yet orphaned metadata context lacks facturaId bounding');
        }
    }
    // Always yield POSITIVE ACKs matching gateway idempotency
    res.status(200).send();
});
//# sourceMappingURL=stripeWebhook.js.map