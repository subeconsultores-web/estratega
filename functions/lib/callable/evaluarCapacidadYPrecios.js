"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluarCapacidadYPrecios = void 0;
const admin = require("firebase-admin");
const https_1 = require("firebase-functions/v2/https");
const db = admin.firestore();
exports.evaluarCapacidadYPrecios = (0, https_1.onCall)({
    cors: true,
    memory: '256MiB',
    maxInstances: 10
}, async (request) => {
    // 1. Authentication Check
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'El usuario debe estar autenticado.');
    }
    const tenantId = request.auth.token['tenantId'];
    if (!tenantId) {
        throw new https_1.HttpsError('permission-denied', 'No tenant ID found in user claims.');
    }
    try {
        console.log(`Evaluando capacidad operativa para el tenant: ${tenantId}`);
        // 2. Fetch Active Users (Capacity)
        const usersSnapshot = await db.collection('users')
            .where('tenantId', '==', tenantId)
            .where('activo', '==', true)
            .get();
        const numConsultores = Math.max(1, usersSnapshot.size); // Evitar división por cero
        // Asumiendo 160 horas por consultor al mes
        const capacidadTotalHoras = numConsultores * 160;
        // 3. Fetch Active Tasks (Workload)
        const tareasSnapshot = await db.collection('tareas')
            .where('tenantId', '==', tenantId)
            .where('estado', 'in', ['todo', 'in_progress', 'review', 'pendiente', 'en_progreso', 'en_revision']) // Manejando múltiples posibles nomenclaturas en el modelo consolidado
            .get();
        let horasEstimadasComprometidas = 0;
        tareasSnapshot.forEach(doc => {
            const data = doc.data();
            const estimado = data.tiempoEstimado || data.horasEstimadas || 0;
            const consumido = data.tiempoConsumido || data.horasReales || 0;
            // Calculamos cuanto trabajo queda pendiente en la tarea
            const restante = Math.max(0, estimado - consumido);
            horasEstimadasComprometidas += restante;
        });
        // 4. Calculate Saturation
        const indiceOcupacion = (horasEstimadasComprometidas / capacidadTotalHoras) * 100;
        // 5. Generate Pricing Suggestion
        let recomendacion = '';
        let tipoAlerta = 'neutral';
        let porcentajeAjusteSugerido = 0;
        if (indiceOcupacion > 85) {
            tipoAlerta = 'premium';
            porcentajeAjusteSugerido = 15; // +15%
            recomendacion = `Alta ocupación del equipo (${indiceOcupacion.toFixed(1)}%). Sugerimos aplicar una tarifa Premium o ajustar los tiempos de entrega.`;
        }
        else if (indiceOcupacion < 50) {
            tipoAlerta = 'descuento';
            porcentajeAjusteSugerido = -10; // -10%
            recomendacion = `Baja ocupación operativa (${indiceOcupacion.toFixed(1)}%). Es un buen momento para aplicar un descuento comercial y acelerar el cierre.`;
        }
        else {
            tipoAlerta = 'neutral';
            recomendacion = `Ocupación saludable (${indiceOcupacion.toFixed(1)}%). Mantener la tabla de precios estándar.`;
        }
        return {
            success: true,
            data: {
                capacidadTotalHoras,
                horasEstimadasComprometidas,
                indiceOcupacion,
                tipoAlerta,
                recomendacion,
                porcentajeAjusteSugerido
            }
        };
    }
    catch (error) {
        console.error('Error calculando capacidad y precios:', error);
        throw new https_1.HttpsError('internal', 'Hubo un error procesando el sistema de tarifas dinámicas.');
    }
});
//# sourceMappingURL=evaluarCapacidadYPrecios.js.map