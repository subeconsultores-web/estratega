import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

export const getPublicCotizacion = functions.https.onCall(async (request) => {
    const { id } = request.data;

    if (!id) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Se requiere el ID de la cotización.'
        );
    }

    try {
        const db = admin.firestore();

        // 1. Fetch Cotización as Root (bypass security rules)
        const cotRef = db.collection('cotizaciones').doc(id);
        const cotSnap = await cotRef.get();

        if (!cotSnap.exists) {
            throw new functions.https.HttpsError('not-found', 'Cotización no encontrada.');
        }

        const cotData = cotSnap.data() as any;

        // 2. We only want to expose specific data (Security Check)
        // If it's a draft, maybe we shouldn't show it?
        if (cotData.estadoActual === 'Borrador') {
            throw new functions.https.HttpsError('failed-precondition', 'La cotización aún está en revisión y no puede ser visualizada públicamente.');
        }

        // 3. Fetch Tenant details for White-Labeling
        const tenantRef = db.collection('tenants').doc(cotData.tenantId);
        const tenantSnap = await tenantRef.get();
        let tenantConfig = null;
        let tenantName = 'Empresa';

        if (tenantSnap.exists) {
            const tData = tenantSnap.data() as any;
            tenantConfig = tData.config || null;
            tenantName = tData.nombreEmpresa || 'Empresa';
        }

        // 4. Fetch Client details (Company Name)
        const clientRef = db.collection('clientes').doc(cotData.clienteId);
        const clientSnap = await clientRef.get();
        let clientName = 'Cliente';

        if (clientSnap.exists) {
            clientName = (clientSnap.data() as any).nombreEmpresa;
        }

        // 5. Build secure return payload
        return {
            success: true,
            cotizacion: {
                id: cotSnap.id,
                correlativo: cotData.correlativo,
                fechaEmision: cotData.fechaEmision,
                fechaExpiracion: cotData.fechaExpiracion,
                items: cotData.items || [],
                subtotal: cotData.subtotal,
                descuento: cotData.descuento || { montoAplicado: 0 },
                porcentajeImpuesto: cotData.porcentajeImpuesto,
                montoImpuesto: cotData.montoImpuesto,
                totalFinal: cotData.totalFinal,
                condicionesAdicionales: cotData.condicionesAdicionales,
                estadoActual: cotData.estadoActual
            },
            tenant: {
                nombreEmpresa: tenantName,
                config: tenantConfig
            },
            cliente: {
                nombreEmpresa: clientName
            }
        };

    } catch (error: any) {
        console.error('Error in getPublicCotizacion:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Ocurrió un error al cargar la cotización pública.');
    }
});
