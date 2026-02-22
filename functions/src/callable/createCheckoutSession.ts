import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env['STRIPE_SECRET_KEY'] || 'sk_test_something', {
    apiVersion: '2025-01-27.acacia' as any, // Uses most recents compatible stripe definitions
});

export const createCheckoutSession = onCall(async (request) => {
    const { facturaId, tenantId } = request.data;
    const uid = request.auth?.uid;

    if (!uid) {
        throw new HttpsError('unauthenticated', 'User must be authenticated to spawn payments.');
    }

    if (!facturaId || !tenantId) {
        throw new HttpsError('invalid-argument', 'Missing facturaId or tenantId properties.');
    }

    const db = admin.firestore();
    const facturaRef = db.doc(`tenants/${tenantId}/facturas/${facturaId}`);
    const facturaSnap = await facturaRef.get();

    if (!facturaSnap.exists) {
        throw new HttpsError('not-found', 'Invoice sequence could not be located in this Tenant node.');
    }

    const factura = facturaSnap.data();

    if (factura?.estado === 'pagada') {
        throw new HttpsError('failed-precondition', 'Este Invoice ya se encuentra saldado.');
    }

    try {
        const isCLP = factura?.moneda?.toUpperCase() === 'CLP';

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'], // Extensible for more locals like Google/Apple Pay
            line_items: [
                {
                    price_data: {
                        currency: factura?.moneda?.toLowerCase() || 'clp',
                        product_data: {
                            name: `Factura ${factura?.codigoFormateado || facturaId}`,
                            description: `Cobro por servicios - Ref: ${factura?.clienteId}`,
                        },
                        // Stripe unit_amount constraint: CLP bears zero decimals. USD carries 100 units.
                        unit_amount: Math.round((factura?.total || 0) * (isCLP ? 1 : 100)),
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
    } catch (error: any) {
        console.error('Core Error creating Stripe Hosted Session Checkout:', error);
        throw new HttpsError('internal', error.message || 'Fatal error mapping Stripe Session payload');
    }
});
