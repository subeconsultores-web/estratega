"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcularPromedioPago = void 0;
const admin = require("firebase-admin");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const db = admin.firestore();
exports.calcularPromedioPago = (0, scheduler_1.onSchedule)({
    schedule: 'every sunday 02:00',
    timeZone: 'America/Santiago',
    timeoutSeconds: 300,
    memory: '256MiB'
}, async (_event) => {
    try {
        console.log('Iniciando cálculo de días promedio de pago por cliente...');
        // 1. Obtener todos los clientes (podría optimizarse a solo clientes activos)
        const clientesSnapshot = await db.collection('clientes').get();
        if (clientesSnapshot.empty) {
            console.log('No hay clientes para analizar.');
            return;
        }
        let actualizados = 0;
        for (const clienteDoc of clientesSnapshot.docs) {
            const clienteId = clienteDoc.id;
            // 2. Obtener todas las facturas pagadas de este cliente
            const facturasSnapshot = await db.collection('facturas')
                .where('clienteId', '==', clienteId)
                .where('estado', '==', 'pagada')
                .get();
            if (facturasSnapshot.empty) {
                // Si no tiene facturas pagadas, podríamos dejarlo en 0 o undefined
                continue;
            }
            let sumaDiasRetraso = 0;
            let facturasConsideradas = 0;
            facturasSnapshot.docs.forEach(doc => {
                var _a, _b, _c, _d;
                const factura = doc.data();
                // Necesitamos la fecha de emisión/vencimiento y la fecha de pago real
                const fechaEmision = ((_b = (_a = factura.fechaEmision) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a)) || new Date(factura.fechaEmision);
                // Determinaremos la fecha de pago basada en el último pago registrado en el array 'pagos'
                // o como fallback la 'updatedAt' si no hay pagos desglosados
                let fechaPagoReal = null;
                if (factura.pagos && Array.isArray(factura.pagos) && factura.pagos.length > 0) {
                    // Buscar la fecha de pago más reciente
                    const fechasPagos = factura.pagos.map((p) => { var _a, _b; return ((_b = (_a = p.fecha) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a)) || new Date(p.fecha); });
                    fechaPagoReal = new Date(Math.max(...fechasPagos.map((d) => d.getTime())));
                }
                else if (factura.updatedAt) {
                    fechaPagoReal = ((_d = (_c = factura.updatedAt) === null || _c === void 0 ? void 0 : _c.toDate) === null || _d === void 0 ? void 0 : _d.call(_c)) || new Date(factura.updatedAt);
                }
                if (fechaEmision && fechaPagoReal) {
                    // Diferencia en milisegundos
                    const diffTime = Math.abs(fechaPagoReal.getTime() - fechaEmision.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    sumaDiasRetraso += diffDays;
                    facturasConsideradas++;
                }
            });
            if (facturasConsideradas > 0) {
                const diasPromedio = Math.round(sumaDiasRetraso / facturasConsideradas);
                // 3. Actualizar el cliente con el nuevo promedio
                await db.collection('clientes').doc(clienteId).update({
                    diasPromedioPago: diasPromedio
                });
                actualizados++;
                console.log(`Cliente ${clienteId}: Promedio ${diasPromedio} días en ${facturasConsideradas} facturas.`);
            }
        }
        console.log(`Proceso finalizado. Clientes actualizados: ${actualizados}`);
    }
    catch (error) {
        console.error('Error calculando promedio de pago:', error);
    }
});
//# sourceMappingURL=calcularPromedioPago.js.map