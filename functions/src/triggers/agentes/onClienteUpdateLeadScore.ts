import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

export const onClienteUpdateLeadScore = onDocumentUpdated("clientes/{clienteId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const beforeData = snapshot.before.data();
    const afterData = snapshot.after.data();

    // Evaluar si cambiaron campos sustanciales para reevaluar el scoring
    const camposCriticos = ['giro', 'sitioWeb', 'volumenFacturacion', 'empleados', 'estado'];

    let requiereReevaluacion = false;
    for (const campo of camposCriticos) {
        if (beforeData[campo] !== afterData[campo]) {
            requiereReevaluacion = true;
            break;
        }
    }

    // Prevenir infinite triggers
    if (beforeData['score'] !== afterData['score']) {
        requiereReevaluacion = false;
    }

    // Si la IA ya puntuó (scoringIA object change) tampoco re-evaluate by infinite loop
    if (JSON.stringify(beforeData['scoringIA']) !== JSON.stringify(afterData['scoringIA'])) {
        requiereReevaluacion = false;
    }

    if (!requiereReevaluacion) {
        return;
    }

    const tenantId = afterData['tenantId'];
    if (!tenantId) return;

    try {
        const db = admin.firestore();
        const tenantDoc = await db.collection('tenants').doc(tenantId).get();
        if (!tenantDoc.exists) return;

        const tenantData = tenantDoc.data();
        const perfilIdeal = tenantData?.['perfilIdealAI'];

        let nuevoScore = afterData['score'] || 0;
        let factorMatch = 0;

        // Si existe un perfil ideal auto-generado por el Cron (entrenarModeloScoringMensual)
        if (perfilIdeal && perfilIdeal.rasgosComunes && perfilIdeal.rasgosComunes.length > 0) {
            const rasgos = perfilIdeal.rasgosComunes;

            // Buscar si el cliente tiene match con la muestra histórica ganadora
            // (Esta es una implementación estocástica veloz, sin llamar al LLM, ahorrando costos)

            // Ejemplo 1: El giro hace match con casos de éxito?
            const girosExitosos = rasgos.map((r: any) => r.giro).filter(Boolean);
            if (girosExitosos.includes(afterData['giro'])) {
                factorMatch += 15; // Gran ponderación si es de la misma industria
            }

            // Ejemplo 2: Tiene presencia web al igual que la mayoría de cierres?
            const sitiosExitosos = rasgos.filter((r: any) => r.sitioWeb).length;
            const probabilidadWeb = sitiosExitosos / rasgos.length;
            if (afterData['sitioWeb'] && probabilidadWeb > 0.5) {
                factorMatch += 5;
            }
        }

        // Aplicamos el factor algorítmico al score existente
        // Ponderándolo suavemente para no destruir el valor que el LLM propuso inicialmente
        nuevoScore = Math.min(100, (nuevoScore * 0.8) + (factorMatch));

        // Grabar asíncronamente
        await snapshot.after.ref.update({
            score: Math.round(nuevoScore),
            recalibracionData: {
                fecha: admin.firestore.FieldValue.serverTimestamp(),
                motivo: 'Re-evaluación Asíncrona AI por actualización de atributos',
                factorAgregado: factorMatch
            }
        });

        console.log(`Cliente ${snapshot.after.id} re-evaluado silenciosamente a ${Math.round(nuevoScore)} puntos gracias al Vertex Profile.`);

    } catch (error) {
        console.error(`Error recalibrando Lead Scoring para cliente ${snapshot.after.id}:`, error);
    }
});
