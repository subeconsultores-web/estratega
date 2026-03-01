import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

export const acceptPublicCotizacion = functions.https.onCall(async (request) => {
    const { id, firmaDato, opcionalesAceptados } = request.data;
    // firmaDato can contain { name, idNumber, ip } from the client

    if (!id || !firmaDato?.name) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Se requiere el ID de la cotización y un Nombre válido para la firma electrónica.'
        );
    }

    try {
        const db = admin.firestore();

        // 1. Fetch Cotización 
        const cotRef = db.collection('cotizaciones').doc(id);
        const cotSnap = await cotRef.get();

        if (!cotSnap.exists) {
            throw new functions.https.HttpsError('not-found', 'Cotización no encontrada.');
        }

        const cotData = cotSnap.data() as any;

        // 2. Security Check (Only specific states can be accepted)
        if (cotData.estadoActual !== 'Enviada' && cotData.estadoActual !== 'Revision_Solicitada') {
            throw new functions.https.HttpsError(
                'failed-precondition',
                'La cotización no se encuentra en un estado válido para ser aceptada públicamente.'
            );
        }

        // 3. Process Optionals and Recalculate Totals (Server-Side Security)
        let newSubtotal = cotData.subtotal || 0;
        let itemsActualizados = [...(cotData.items || [])];

        if (Array.isArray(opcionalesAceptados) && opcionalesAceptados.length > 0) {
            // Re-calculate Base Subtotal properly 
            newSubtotal = 0;
            itemsActualizados = itemsActualizados.map((item: any, i: number) => {
                let isAccepted = false;
                if (!item.opcional) {
                    isAccepted = true; // Firm base
                } else if (opcionalesAceptados.includes(i)) {
                    isAccepted = true;
                    item.aceptadoClientSide = true; // Mark as accepted by client
                } else {
                    item.aceptadoClientSide = false;
                }

                if (isAccepted) {
                    newSubtotal += item.subtotal;
                }
                return item;
            });
        }

        // Ensure discount math is correct with NEW subtotal
        let newDescuentoMonto = 0;
        if (cotData.descuento) {
            if (cotData.descuento.tipo === 'monto') {
                newDescuentoMonto = Math.min(cotData.descuento.valor, newSubtotal);
            } else if (cotData.descuento.tipo === 'porcentaje') {
                newDescuentoMonto = newSubtotal * (cotData.descuento.valor / 100);
            }
        }

        const subtotalConDescuento = newSubtotal - newDescuentoMonto;

        // Recalculate tax
        const newMontoImpuesto = subtotalConDescuento * ((cotData.porcentajeImpuesto || 0) / 100);

        // Final Total
        const newTotalFinal = subtotalConDescuento + newMontoImpuesto;

        // 4. Build Audit History Entry for Signature
        const opcionesMsg = Array.isArray(opcionalesAceptados) && opcionalesAceptados.length > 0
            ? ` con ${opcionalesAceptados.length} adicional(es)`
            : '';

        const newHistoryRecord = {
            estado: 'Aceptada',
            fecha: admin.firestore.Timestamp.now(),
            actorId: 'Firma_Externa: ' + firmaDato.name,
            comentario: `Cotización Aceptada y Firmada Electrónicamente por ${firmaDato.name}` + (firmaDato.idNumber ? ` (${firmaDato.idNumber})` : '') + opcionesMsg
        };

        const currentHistory = cotData.historialEstados || [];
        const nextHistoryArray = [...currentHistory, newHistoryRecord];

        // 5. Update the Cotización
        await cotRef.update({
            estadoActual: 'Aceptada',
            historialEstados: nextHistoryArray,
            updatedAt: admin.firestore.Timestamp.now(),
            firmaElectronica: {
                ...firmaDato,
                fechaIP: admin.firestore.Timestamp.now()
            },
            items: itemsActualizados,
            subtotal: newSubtotal,
            'descuento.montoAplicado': newDescuentoMonto,
            montoImpuesto: newMontoImpuesto,
            totalFinal: newTotalFinal
        });

        // 6. Build success response
        return {
            success: true,
            message: 'Cotización aceptada y firmada de manera exitosa.'
        };

    } catch (error: any) {
        console.error('Error in acceptPublicCotizacion:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Ocurrió un error al procesar la firma electrónica.');
    }
});
