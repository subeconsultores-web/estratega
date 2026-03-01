"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.briefingSemanal = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const genai_1 = require("@google/genai");
const params_1 = require("firebase-functions/params");
const geminiApiKey = (0, params_1.defineSecret)("GEMINI_API_KEY");
exports.briefingSemanal = (0, scheduler_1.onSchedule)({
    schedule: "0 23 * * 0", // Todos los Domingos a las 23:00 hrs
    timeZone: "America/Santiago",
    secrets: [geminiApiKey],
    timeoutSeconds: 300, // Extendemos timeout por si hay muchos tenants
    memory: "512MiB"
}, async (_event) => {
    try {
        const db = admin.firestore();
        // Obtener todos los tenants (Empresas)
        const tenantsSnapshot = await db.collection('tenants').get();
        const ai = new genai_1.GoogleGenAI({
            apiKey: geminiApiKey.value()
        });
        // Generar un briefing para cada tenant
        for (const tenantDoc of tenantsSnapshot.docs) {
            const tenantId = tenantDoc.id;
            const tenantData = tenantDoc.data();
            // 1. Recopilar métricas clave del tenant
            const unaSemanaAtras = new Date();
            unaSemanaAtras.setDate(unaSemanaAtras.getDate() - 7);
            // a) Clientes nuevos esta semana
            const nuevosClientesSnap = await db.collection('clientes')
                .where('tenantId', '==', tenantId)
                .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(unaSemanaAtras))
                .get();
            // b) Facturas Pagadas (Ingresos reales)
            const facturasCobradasSnap = await db.collection('facturas')
                .where('tenantId', '==', tenantId)
                .where('estado', '==', 'pagada')
                .where('fechaPago', '>=', admin.firestore.Timestamp.fromDate(unaSemanaAtras))
                .get();
            let ingresosSemana = 0;
            facturasCobradasSnap.forEach(doc => ingresosSemana += (doc.data().total || 0));
            // c) Cotizaciones Generadas (Pipeline futuro)
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
            // 2. Ejecutar análisis con IA (Prompt CFO-AI)
            const nombreAgencia = tenantData['nombre'] || 'la Agencia';
            const systemPrompt = `Eres CFO-AI, el Director Financiero Autónomo de ${nombreAgencia} (integrado en el Ecosistema Estratega Sube).
Tu objetivo es redactar un Resumen Ejecutivo Semanal asíncrono, que se enviará automáticamente por email al equipo dueño la noche del domingo.
Debe ser escrito 100% en formato HTML limpio para ser incrustado en un email. Usa estilos CSS inline muy sutiles si consideras necesario. 
Estructura obligatoria:
1. Saludo breve y ejecutivo.
2. Viñetas con las 3 métricas de la semana.
3. Dos recomendaciones accionables precisas (ej. "Tienen $X atrapados en pipeline, sugiero ofrecer descuento XYZ", o "El flujo de caja fue bajo, sugiero contactar deudores").
Mantén un tono profesional, optimista y extremadamente directivo.`;
            const userPrompt = `Datos financieros y operacionales recolectados de los últimos 7 días:
- Nuevos Prospectos CRM ingresados: ${nuevosClientesSnap.size}
- Ingresos Líquidos Cobrados: $${ingresosSemana}
- Nuevo Pipeline Comercial Creado: $${pipelineGenerado}

Genera el resumen CFO-AI en HTML.`;
            const chat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: systemPrompt,
                    temperature: 0.2 // Rigor ejecutivo
                }
            });
            const response = await chat.sendMessage({ message: userPrompt });
            const resumenIAHtml = response.text || '<p>Error al generar reporte.</p>';
            // 3. Guardar el Briefing en BD para historial interno
            await db.collection(`tenants/${tenantId}/briefings`).add({
                fechaGeneracion: admin.firestore.Timestamp.now(),
                tipo: 'semanal',
                ingresosReportados: ingresosSemana,
                pipelineReportado: pipelineGenerado,
                nuevosClientesReportados: nuevosClientesSnap.size,
                resumenIA: resumenIAHtml, // Ahora es HTML
                leido: false
            });
            // 4. Integración Firebase Trigger Email Extension
            // Enviamos el correo mediante la creación de un documento en la colección 'mail'
            if (tenantData['email']) {
                await db.collection('mail').add({
                    to: tenantData['email'],
                    message: {
                        subject: `📊 Resumen Ejecutivo Dominical CFO-AI - ${nombreAgencia}`,
                        html: resumenIAHtml,
                    }
                });
                console.log(`CFO-AI Reporte encolado en Trigger Email para: ${tenantData['email']}`);
            }
            else {
                console.warn(`El tenant ${tenantId} no tiene un email configurado para recibir el CFO Report.`);
            }
        }
    }
    catch (error) {
        console.error("Error ejecutando CFO-AI Semanal:", error);
    }
});
//# sourceMappingURL=briefingSemanal.js.map