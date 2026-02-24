import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";

export const entrenarModeloScoringMensual = onSchedule({
    schedule: "0 0 1 * *", // Ejecutar el día 1 de cada mes a medianoche
    timeZone: "America/Santiago",
    timeoutSeconds: 540, // 9 min timeout por procesamiento batch extenso
    memory: "1GiB"
}, async (event) => {
    try {
        const db = admin.firestore();
        const tenantsSnapshot = await db.collection('tenants').get();

        for (const tenantDoc of tenantsSnapshot.docs) {
            const tenantId = tenantDoc.id;

            // Encontrar todos los proyectos Completados para este tenant para analizar su rentabilidad
            const proyectosRef = db.collection('proyectos');
            const proyectosSnapshot = await proyectosRef
                .where('tenantId', '==', tenantId)
                .where('estado', '==', 'completado')
                .get();

            if (proyectosSnapshot.empty) {
                console.log(`Tenant ${tenantId}: Sin proyectos completados para entrenar modelo AI.`);
                continue;
            }

            // Métrica de rentabilidad: (IngresoTotal - CostoReal) / CostoReal
            let proyectosRentables: any[] = [];

            proyectosSnapshot.forEach(doc => {
                const data = doc.data();
                const ingreso = data['ingresoTotal'] || 0;
                const costo = data['costoReal'] || 1; // Prevenir división por 0
                const roi = (ingreso - costo) / costo;

                proyectosRentables.push({
                    id: doc.id,
                    clienteId: data['clienteId'],
                    roi: roi
                });
            });

            // Ordenar por ROI descendente
            proyectosRentables.sort((a, b) => b.roi - a.roi);

            // Seleccionar al top 10% (mínimo 1)
            const topCount = Math.max(1, Math.floor(proyectosRentables.length * 0.10));
            const topProyectos = proyectosRentables.slice(0, topCount);

            // Recolectar atributos de los clientes del top 10%
            const perfilesIdeales = [];
            for (const p of topProyectos) {
                if (p.clienteId) {
                    const cDoc = await db.collection('clientes').doc(p.clienteId).get();
                    if (cDoc.exists) {
                        const cData = cDoc.data();
                        perfilesIdeales.push({
                            giro: cData?.['giro'],
                            scoreHistorico: cData?.['score'],
                            sitioWeb: cData?.['sitioWeb'] ? true : false,
                        });
                    }
                }
            }

            // Calcular pesos algorítmicos dinámicos e inyectar al Tenant
            // Este registro "perfilIdeal" luego es consumido por OnClienteUpdate para recalcular
            await db.collection('tenants').doc(tenantId).update({
                perfilIdealAI: {
                    fechaCalibracion: admin.firestore.FieldValue.serverTimestamp(),
                    muestraExito: topCount,
                    totalAnalizados: proyectosRentables.length,
                    rasgosComunes: perfilesIdeales
                }
            });

            console.log(`Modelo de Lead Scoring re-calibrado para el tenant ${tenantId}.`);
        }

    } catch (error) {
        console.error("Error entrenando modelo de scoring mensual AI:", error);
    }
});
