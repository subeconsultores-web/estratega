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
                    moneda: session.currency?.toUpperCase() || 'CLP',
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
