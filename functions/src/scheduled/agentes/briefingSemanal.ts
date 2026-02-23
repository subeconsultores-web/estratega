import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import { GoogleGenAI } from "@google/genai";
import { defineSecret } from "firebase-functions/params";

const geminiApiKey = defineSecret("GEMINI_API_KEY");

export const briefingSemanal = onSchedule({
    schedule: "0 8 * * 1", // Todos los Lunes a las 08:00
    timeZone: "America/Santiago",
    secrets: [geminiApiKey]
}, async (event) => {
    try {
        const db = admin.firestore();
        // Obtener todos los tenants (Empresas)
        const tenantsSnapshot = await db.collection('tenants').get();

        const ai = new GoogleGenAI({
            apiKey: geminiApiKey.value()
        });

        // Generar un briefing para cada tenant
        for (const tenantDoc of tenantsSnapshot.docs) {
            const tenantId = tenantDoc.id;
            const tenantData = tenantDoc.data();

            // 1. Recopilar métricas clave del tenant
            // a) Clientes nuevos esta semana
            const unaSemanaAtras = new Date();
            unaSemanaAtras.setDate(unaSemanaAtras.getDate() - 7);

            const nuevosClientesSnap = await db.collection('clientes')
                .where('tenantId', '==', tenantId)
                .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(unaSemanaAtras))
                .get();

            const facturasCobradasSnap = await db.collection('facturas')
                .where('tenantId', '==', tenantId)
                .where('estado', '==', 'pagada')
                .where('fechaPago', '>=', admin.firestore.Timestamp.fromDate(unaSemanaAtras))
                .get();

            let ingresosSemana = 0;
            facturasCobradasSnap.forEach(doc => ingresosSemana += (doc.data().total || 0));

            const nuevasCotizacionesSnap = await db.collection('cotizaciones')
                .where('tenantId', '==', tenantId)
                .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(unaSemanaAtras))
                .get();

            let pipelineGenerado = 0;
            nuevasCotizacionesSnap.forEach(doc => pipelineGenerado += (doc.data().total || 0));

            // Si no hay actividad, podemos saltar o enviar un resumen indicando inactividad
            if (nuevosClientesSnap.empty && facturasCobradasSnap.empty && nuevasCotizacionesSnap.empty) {
                continue;
            }

            // 2. Ejecutar análisis con IA
            const systemPrompt = `Eres Estratega Sube IA. Escribe un Briefing Ejecutivo Semanal conciso y alentador para el gerente del CRM.
Debe ser en formato Markdown o HTML (idealmente correo). Usa un tono profesional y optimista. Formula 2 recomendaciones accionables.`;

            const userPrompt = `Datos de la Semana (Últimos 7 días) para la empresa ${tenantData['nombre'] || 'del tenant'}:
- Nuevos Clientes (Leads/Prospectos creados): ${nuevosClientesSnap.size}
- Ingresos Cobrados (Facturas pagadas): $${ingresosSemana}
- Nuevo Pipeline Generado (Oportunidades creadas): $${pipelineGenerado}

Genera un resumen breve de 2-3 párrafos destacando los logros y sugiriendo el foco para esta nueva semana.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: userPrompt,
                config: {
                    systemInstruction: systemPrompt,
                    temperature: 0.3
                }
            });

            const resumenIA = response.text;

            // 3. Guardar el Briefing en BD para ser mostrado en una vista "Notificaciones" o Dashboard
            await db.collection(`tenants/${tenantId}/briefings`).add({
                fechaGeneracion: admin.firestore.Timestamp.now(),
                tipo: 'semanal',
                ingresosReportados: ingresosSemana,
                pipelineReportado: pipelineGenerado,
                nuevosClientesReportados: nuevosClientesSnap.size,
                resumenIA: resumenIA,
                leido: false
            });

            // NOTA: Para enviar por correo, aquí se integraría una llamada a la extensión de Trigger Email o una API como SendGrid.
            console.log(`Briefing semanal generado exitosamente para tenant: ${tenantId}`);
        }

    } catch (error) {
        console.error("Error ejecutando Briefing Semanal AI:", error);
    }
});
