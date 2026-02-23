"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCheckoutSession = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const stripe_1 = require("stripe");
const stripe = new stripe_1.default(process.env['STRIPE_SECRET_KEY'] || 'sk_test_something', {
    apiVersion: '2025-01-27.acacia', // Uses most recents compatible stripe definitions
});
exports.createCheckoutSession = (0, https_1.onCall)(async (request) => {
    var _a, _b, _c;
    const { facturaId, tenantId } = request.data;
    const uid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!uid) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated to spawn payments.');
    }
    if (!facturaId || !tenantId) {
        throw new https_1.HttpsError('invalid-argument', 'Missing facturaId or tenantId properties.');
    }
    const db = admin.firestore();
    const facturaRef = db.doc(`facturas/${facturaId}`);
    const facturaSnap = await facturaRef.get();
    if (!facturaSnap.exists) {
        throw new https_1.HttpsError('not-found', 'Invoice sequence could not be located in this Tenant node.');
    }
    const factura = facturaSnap.data();
    if ((factura === null || factura === void 0 ? void 0 : factura.estado) === 'pagada') {
        throw new https_1.HttpsError('failed-precondition', 'Este Invoice ya se encuentra saldado.');
    }
    try {
        const isCLP = ((_b = factura === null || factura === void 0 ? void 0 : factura.moneda) === null || _b === void 0 ? void 0 : _b.toUpperCase()) === 'CLP';
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'], // Extensible for more locals like Google/Apple Pay
            line_items: [
                {
                    price_data: {
                        currency: ((_c = factura === null || factura === void 0 ? void 0 : factura.moneda) === null || _c === void 0 ? void 0 : _c.toLowerCase()) || 'clp',
                        product_data: {
                            name: `Factura ${(factura === null || factura === void 0 ? void 0 : factura.codigoFormateado) || facturaId}`,
                            description: `Cobro por servicios - Ref: ${factura === null || factura === void 0 ? void 0 : factura.clienteId}`,
                        },
                        // Stripe unit_amount constraint: CLP bears zero decimals. USD carries 100 units.
                        unit_amount: Math.round(((factura === null || factura === void 0 ? void 0 : factura.total) || 0) * (isCLP ? 1 : 100)),
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment', // Standard payment structure
            // Redirects mapping front-end parameterized router callbacks. In Prod replace Localhost with hosted origin domain via Env logic 
            success_url: `http://localhost:4200/facturas/${facturaId}/view?checkout=success`,
            cancel_url: `http://localhost:4200/facturas/${facturaId}/view?checkout=canceled`,
            metadata: {
                facturaId: facturaId,
                tenantId: tenantId
            }
        });
        // We write backwards pushing the SessionId to persist correlation across unfinalized sessions
        await facturaRef.update({
            stripeCheckoutSessionId: session.id,
            urlStripeCheckout: session.url
        });
        return { url: session.url };
    }
    catch (error) {
        console.error('Core Error creating Stripe Hosted Session Checkout:', error);
        throw new https_1.HttpsError('internal', error.message || 'Fatal error mapping Stripe Session payload');
    }
});
//# sourceMappingURL=createCheckoutSession.js.map