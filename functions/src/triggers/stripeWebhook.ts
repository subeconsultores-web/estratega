import { onRequest } from "firebase-functions/v2/https";
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env['STRIPE_SECRET_KEY'] || 'sk_test_something', {
    apiVersion: '2025-01-27.acacia' as any,
});

const endpointSecret = process.env['STRIPE_WEBHOOK_SECRET'] || 'whsec_test';

export const stripeWebhook = onRequest(async (req, res) => {
    // Stripe HTTP callbacks attach strict symmetric encrypted headers mapped 'stripe-signature'
    const sig = req.headers['stripe-signature'];

    if (!sig) {
        console.warn('Webhook called with no Stripe Signature present in HttpHeader');
        res.status(400).send('No signature found');
        return;
    }

    let event: Stripe.Event;

    try {
        // Validation occurs against rawBody buffer injection specifically to negate arbitrary object replacements 
        event = stripe.webhooks.constructEvent((req as any).rawBody, sig, endpointSecret);
    } catch (err: any) {
        console.error(`Webhook cryptographic signature verification validation failed: ${err.message}`);
        res.status(400).send(`Webhook Validation Error: ${err.message}`);
        return;
    }

    // Process secure lifecycle pipeline mapped from Stripe
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        // Extract metadata bridging correlation bindings stored earlier in 'createCheckoutSession'
        const facturaId = session.metadata?.['facturaId'];
        const tenantId = session.metadata?.['tenantId'];
        const paymentIntentId = session.payment_intent as string;

        if (facturaId && tenantId) {
            const db = admin.firestore();
            try {
                // Apply strict DB atomicity directly overwriting the associated Invoice lifecycle bounds indicating external 'pagada' trigger event
                await db.doc(`tenants/${tenantId}/facturas/${facturaId}`).update({
                    estado: 'pagada',
                    stripePaymentIntentId: paymentIntentId,
                    montoPagado: session.amount_total ? (session.currency === 'clp' ? session.amount_total : session.amount_total / 100) : 0,
                    montoPendiente: 0,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                console.log(`[Success] Securing Factura: ${facturaId} marked automatically as fully pagada traversing mapped secure gateway. Data persistence confirmed.`);
            } catch (error) {
                console.error('Fatal execution hook while persisting database metadata on Webhook arrival!', error);
            }
        } else {
            console.warn('Stripe Checkout process completed externally yet orphaned metadata context lacks facturaId bounding');
        }
    }

    // Always yield POSITIVE ACKs matching gateway idempotency
    res.status(200).send();
});
