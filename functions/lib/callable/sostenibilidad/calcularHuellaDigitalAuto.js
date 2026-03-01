"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcularHuellaDigitalAuto = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
exports.calcularHuellaDigitalAuto = (0, https_1.onCall)(async (request) => {
    var _a;
    // 1. Verificación de Autenticación
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'El usuario debe estar autenticado para calcular la huella digital.');
    }
    const tenantId = request.auth.token['tenantId'] || ((_a = request.data) === null || _a === void 0 ? void 0 : _a.tenantId);
    if (!tenantId) {
        throw new https_1.HttpsError('permission-denied', 'No se ha proporcionado un Tenant válido.');
    }
    try {
        const db = admin.firestore();
        // 2. Recolección de Métricas de Uso de Plataforma
        // Usuarios activos
        const usersSnap = await db.collection('users').where('tenantId', '==', tenantId).get();
        const totalUsers = usersSnap.size || 0;
        // Proyectos
        const proyectosSnap = await db.collection('proyectos').where('tenantId', '==', tenantId).get();
        const totalProyectos = proyectosSnap.size || 0;
        // Tareas evaluadas / cotizaciones / etc (Podemos expandir según requerimiento, usamos usuarios y proyectos por defecto)
        // Fórmula Estimada: Cada usuario gasta ~2 kWh/mes en uso promedios de plataforma.
        // Y la gestión de proyecto en servidor/storage gasta ~5 kWh/mes por proyecto activo.
        const consumoEstimadoKWh = (totalUsers * 2) + (totalProyectos * 5);
        // Prevención de ingreso si no hay uso registrado (cero)
        if (consumoEstimadoKWh === 0) {
            return {
                success: false,
                message: 'No hay suficientes datos de actividad para generar un reporte de Huella de Carbono.',
                huellaCarbonoKgCO2eq: 0
            };
        }
        const factorEmisionRedCL = 0.28; // Referencia de mercado eléctrico
        const huellaCarbonoKgCO2eq = consumoEstimadoKWh * factorEmisionRedCL;
        const hoy = new Date();
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        // 3. Crear el Registro de Sostenibilidad Automático
        const nuevoRegistro = {
            tenantId: tenantId,
            tipoRecurso: 'otro',
            consumoBruto: consumoEstimadoKWh,
            unidadMedida: 'kWh',
            fechaInicioPeriodo: admin.firestore.Timestamp.fromDate(inicioMes),
            fechaFinPeriodo: admin.firestore.Timestamp.fromDate(finMes),
            factorEmisionUtilizado: factorEmisionRedCL,
            huellaCarbonoKgCO2eq: huellaCarbonoKgCO2eq,
            procesadoPorAI: true,
            fechaProcesamiento: admin.firestore.FieldValue.serverTimestamp(),
            documentoFuenteId: 'metricas-uso-plataforma'
        };
        const docRef = await db.collection('sostenibilidad').add(nuevoRegistro);
        console.log(`[ESG] Huella Digital calculada para Tenant ${tenantId}: ${huellaCarbonoKgCO2eq} kg CO2eq`);
        return {
            success: true,
            registroId: docRef.id,
            huellaCarbonoKgCO2eq,
            metricas: {
                usuariosCalculados: totalUsers,
                proyectosCalculados: totalProyectos,
                consumoKWh: consumoEstimadoKWh
            }
        };
    }
    catch (error) {
        console.error('[ESG] Error calculando huella digital automática:', error);
        throw new https_1.HttpsError('internal', 'Error al calcular y registrar la huella de carbono digital.');
    }
});
//# sourceMappingURL=calcularHuellaDigitalAuto.js.map