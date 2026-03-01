"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cronPredictiveBurnRate = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
exports.cronPredictiveBurnRate = functions
    .runWith({ timeoutSeconds: 300, memory: "512MB" })
    .pubsub.schedule("every 24 hours")
    .onRun(async (context) => {
    var _a;
    const db = admin.firestore();
    const proyectosRef = db.collectionGroup("proyectos");
    try {
        // Evaluamos todos los proyectos activos o en curso
        const snapshot = await proyectosRef.where("estado", "==", "activo").get();
        if (snapshot.empty) {
            console.log("No hay proyectos activos para evaluar.");
            return null;
        }
        const batch = db.batch();
        let alertasGeneradas = 0;
        for (const doc of snapshot.docs) {
            const proyecto = doc.data();
            const horasEstimadas = proyecto.horasEstimadas || 0;
            const horasInvertidas = proyecto.horasInvertidas || 0;
            const progresoTecnico = proyecto.progresoGlobal || 0; // Calculado previamente por Kanban
            // Solo evaluar proyectos donde se haya fijado un estimado
            if (horasEstimadas <= 0)
                continue;
            const porcentajeConsumo = (horasInvertidas / horasEstimadas) * 100;
            let burnRateRatio = 1;
            if (progresoTecnico > 0) {
                burnRateRatio = porcentajeConsumo / progresoTecnico;
            }
            else if (porcentajeConsumo > 0) {
                burnRateRatio = porcentajeConsumo; // Riesgo máximo si gasto tiempo y no avanzo
            }
            // Condición de Peligro: El porcentaje consumido va 20% más rápido que el avance real 
            // Y ya he consumido al menos el 50% de las horas totales.
            const estaEnPeligro = burnRateRatio > 1.2 && porcentajeConsumo > 50;
            // Crear log/alerta in-app para el Project Manager si entró recientemente en peligro
            if (estaEnPeligro && !proyecto.alertaBurnRateActiva) {
                alertasGeneradas++;
                // 1. Guardar alerta en subcolección de notificaciones para el tenant
                // Usamos el id del proyecto para inferir el path (tenants/{tenantId}/proyectos/{proyectoId})
                const tenantId = (_a = doc.ref.parent.parent) === null || _a === void 0 ? void 0 : _a.id;
                if (tenantId) {
                    const notifRef = db.collection(`tenants/${tenantId}/notifications`).doc();
                    batch.set(notifRef, {
                        title: `⚠️ Riesgo de Rentabilidad: ${proyecto.nombre}`,
                        message: `El proyecto ha consumido el ${porcentajeConsumo.toFixed(0)}% de sus horas, pero solo tiene un avance técnico del ${progresoTecnico.toFixed(0)}%. Ratio: ${burnRateRatio.toFixed(2)}x.`,
                        type: 'FINANCIAL_ALERT',
                        proyectoId: doc.id,
                        read: false,
                        createdAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                }
                // 2. Marcar state en proyecto
                batch.update(doc.ref, {
                    alertaBurnRateActiva: true,
                    ultimoBurnRateRatio: burnRateRatio
                });
            }
            else if (!estaEnPeligro && proyecto.alertaBurnRateActiva) {
                // Sanó el proyecto (Ej: se ampliaron horas estimadas), remover flag de riesgo agudo
                batch.update(doc.ref, { alertaBurnRateActiva: false });
            }
            else if (estaEnPeligro && proyecto.alertaBurnRateActiva) {
                // Solo actualizar ratio
                batch.update(doc.ref, { ultimoBurnRateRatio: burnRateRatio });
            }
        }
        await batch.commit();
        console.log(`Evaluación de Burn-Rate exitosa. ${alertasGeneradas} alertas nuevas generadas.`);
        return null;
    }
    catch (error) {
        console.error("Error evaluating burn-rate:", error);
        throw error;
    }
});
//# sourceMappingURL=cronPredictiveBurnRate.js.map