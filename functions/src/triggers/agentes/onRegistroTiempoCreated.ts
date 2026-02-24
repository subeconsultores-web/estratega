import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

export const onRegistroTiempoCreated = onDocumentCreated('registrosTiempo/{registroId}', async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
        return;
    }

    const registro = snapshot.data();
    const proyectoId = registro['proyectoId'];
    const tenantId = registro['tenantId'];

    if (!proyectoId || !tenantId) {
        console.log('El registro de tiempo no está asociado a un proyecto o tenant válido.');
        return;
    }

    const db = admin.firestore();
    const proyectoRef = db.collection('proyectos').doc(proyectoId);

    try {
        // En una transacción o batch para mayor consistencia, pero aquí leemos el proyecto
        const proyectoDoc = await proyectoRef.get();
        if (!proyectoDoc.exists) return;

        const proyectoData = proyectoDoc.data();
        if (!proyectoData) return;

        // 1. Obtener Horas Estimadas Globales
        const equipo = proyectoData['equipo'] || [];
        let horasEstimadasGlobales = 0;
        equipo.forEach((miembro: any) => {
            horasEstimadasGlobales += (miembro.horasAsignadas || 0);
        });

        if (horasEstimadasGlobales === 0) {
            console.log('El proyecto no tiene horas estimadas. Scrum-AI no intervendrá.');
            return;
        }

        // 2. Acumular Horas Reales Agrupadas
        const registrosRef = await db.collection('registrosTiempo')
            .where('proyectoId', '==', proyectoId)
            .get();

        let minutosTotales = 0;
        registrosRef.forEach(doc => {
            minutosTotales += (doc.data()['duracionMinutos'] || 0);
        });

        const horasRealesAgrupadas = minutosTotales / 60;

        // 3. Evaluar condición de riesgo Scrum-AI
        const consumoHoras = horasRealesAgrupadas / horasEstimadasGlobales;
        const progresoTicks = proyectoData['progreso'] || 0;

        // Condición: Si se ha consumido más del 80% de las horas y el avance es menor al 50%
        if (consumoHoras > 0.8 && progresoTicks < 50) {
            // Prevenir triggers duplicados si ya está marcado
            if (proyectoData['enRiesgo']) {
                console.log(`El proyecto ${proyectoId} ya está marcado en riesgo.`);
                return;
            }

            // Marcar proyecto en riesgo
            await proyectoRef.update({
                enRiesgo: true,
                motivoRiesgo: 'Scrum-AI: Consumo de horas superior al 80% con avance menor al 50%.',
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // Enviar notificación CRM Automática al dueño o mánagers
            await db.collection('notificaciones').add({
                tenantId: tenantId,
                titulo: '⚠️ Proyecto en Riesgo (Scrum-AI)',
                mensaje: `El proyecto "${proyectoData['nombre']}" ha consumido ${horasRealesAgrupadas.toFixed(1)} hrs de ${horasEstimadasGlobales} hrs totales, pero su avance es solo del ${progresoTicks}%. Requiere intervención inmediata.`,
                tipo: 'alerta',
                leida: false,
                referenciaId: proyectoId,
                referenciaTipo: 'proyecto',
                fecha: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log(`Scrum-AI: Proyecto ${proyectoId} marcado en riesgo exitosamente.`);
        } else {
            // Si el proyecto se recupera, podríamos desmarcarlo (opcional)
            if (proyectoData['enRiesgo'] && consumoHoras <= 0.8) {
                await proyectoRef.update({
                    enRiesgo: false,
                    motivoRiesgo: admin.firestore.FieldValue.delete(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }
        }

    } catch (error) {
        console.error(`Error en Scrum-AI para el proyecto ${proyectoId}:`, error);
    }
});
