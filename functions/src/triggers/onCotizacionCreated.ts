import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

// Trigger que simula un "Transaccional/Atómico" para inyectar correlativo a cotizaciones
export const onCotizacionCreated = functions.firestore.onDocumentCreated('cotizaciones/{docId}', async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
        console.log('No data associated with the event');
        return;
    }

    const docId = event.params.docId;
    const data = snapshot.data();
    const tenantId = data['tenantId'];

    if (!tenantId) {
        console.error(`Cotizacion ${docId} sin tenantId. Ignorando.`);
        return;
    }

    // Inicializar Firestore DB
    const db = admin.firestore();

    try {
        await db.runTransaction(async (t) => {
            const configRef = db.collection('tenants').doc(tenantId);
            const configDoc = await t.get(configRef);

            let nuevoCorrelativo = 1;

            if (configDoc.exists) {
                const configData = configDoc.data();
                // Verifica si existe la jerarquía config -> correlativos -> cotizacion
                if (configData && configData['correlativos'] && configData['correlativos']['cotizacion']) {
                    nuevoCorrelativo = configData['correlativos']['cotizacion'] + 1;
                }
            }

            // Actualiza el correlativo en el Tenant (config)
            t.set(configRef, {
                correlativos: {
                    cotizacion: nuevoCorrelativo
                }
            }, { merge: true });

            // Actualiza la cotización recién creada con su correlativo y código formateado
            const cotizacionRef = db.collection('cotizaciones').doc(docId);
            const codigoFormateado = `COT-${nuevoCorrelativo.toString().padStart(4, '0')}`;

            t.update(cotizacionRef, {
                correlativo: nuevoCorrelativo,
                codigoFormateado: codigoFormateado
            });
            console.log(`Cotizacion ${docId} actualizada con correlativo ${nuevoCorrelativo} (${codigoFormateado})`);
        });

    } catch (error) {
        console.error(`Transaction failed for cotizacion ${docId}:`, error);
    }
});
