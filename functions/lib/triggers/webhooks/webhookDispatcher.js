"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookDispatcherClientes = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
exports.webhookDispatcherClientes = (0, firestore_1.onDocumentCreated)('clientes/{clienteId}', async (event) => {
    const snapshot = event.data;
    if (!snapshot)
        return;
    const data = snapshot.data();
    const tenantId = data.tenantId;
    if (!tenantId)
        return;
    try {
        const db = admin.firestore();
        // Buscar webhooks activos configurados para este tenant y este evento
        const webhooksSnapshot = await db.collection('webhooks')
            .where('tenantId', '==', tenantId)
            .where('isActive', '==', true)
            .where('events', 'array-contains', 'cliente.creado')
            .get();
        if (webhooksSnapshot.empty) {
            console.log(`No hay webhooks activos para cliente.creado en el tenant ${tenantId}`);
            return;
        }
        // Payload a enviar a los webhooks
        const payload = {
            event: 'cliente.creado',
            timestamp: new Date().toISOString(),
            data: Object.assign({ id: event.params.clienteId }, data)
        };
        // Hacer los POST asíncronos a cada URL suscrita
        const fetchPromises = webhooksSnapshot.docs.map(async (doc) => {
            const webhook = doc.data();
            try {
                const response = await fetch(webhook.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'SubeEstratega-WebhookBot/1.0'
                    },
                    body: JSON.stringify(payload)
                });
                if (!response.ok) {
                    console.error(`Error enviando webhook a ${webhook.url}: ${response.status} ${response.statusText}`);
                    // Opcional: Registrar fallo en Firestore
                }
                else {
                    console.log(`Webhook enviado exitosamente a ${webhook.url}`);
                }
            }
            catch (error) {
                console.error(`Fallo de red enviando webhook a ${webhook.url}`, error);
            }
        });
        await Promise.allSettled(fetchPromises);
    }
    catch (error) {
        console.error('Error procesando webhooks de clientes:', error);
    }
});
//# sourceMappingURL=webhookDispatcher.js.map