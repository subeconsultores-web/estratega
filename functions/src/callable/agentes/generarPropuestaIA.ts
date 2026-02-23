import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { GoogleGenAI } from "@google/genai";
import { defineSecret } from "firebase-functions/params";

const geminiApiKey = defineSecret("GEMINI_API_KEY");

export const generarPropuestaIA = onCall({
    cors: true,
    secrets: [geminiApiKey]
}, async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Autenticación requerida.');
    }

    const { clienteId, serviciosOfrecidos, tono = 'formal', contextoExtra = '' } = request.data;

    if (!clienteId || !serviciosOfrecidos) {
        throw new HttpsError('invalid-argument', 'Faltan parámetros requeridos (clienteId, serviciosOfrecidos).');
    }

    try {
        const db = admin.firestore();

        // Obtener datos del cliente
        // Asumiendo estructura de path: clientes/{clienteId} o similar (hay que ubicar el tenant)
        // Ya que la colección cliente está anidada o a nivel raíz, iteraremos o buscaremos directamente si conocemos la estructura

        // En este sistema, típicamente `clientes` es una colección top-level tenant-aware o subcolección
        let clienteRef = db.collection('clientes').doc(clienteId);
        let clienteDoc = await clienteRef.get();

        if (!clienteDoc.exists) {
            // Podría ser path: tenants/{tenantId}/clientes/{clienteId}
            // Asumamos top-level 'clientes' donde existe tenantId.
            throw new HttpsError('not-found', 'Cliente no encontrado.');
        }

        const dataCliente = clienteDoc.data() || {};
        const empresa = dataCliente.nombreEmpresa || 'el Cliente';
        const contacto = dataCliente.contactoPrincipal?.nombre || 'Representante';

        // Iniciamos el modelo
        const ai = new GoogleGenAI({
            apiKey: geminiApiKey.value()
        });

        const systemPrompt = `Eres un creador de propuestas comerciales experto y persuasivo. 
Tu objetivo es redactar una Propuesta Comercial de Alto Valor en formato Markdown.
El tono de la propuesta debe ser: ${tono}.
Estructura deseada:
1. Encabezado profesional (fecha, para quién, de quién).
2. Resumen Ejecutivo (El dolor del cliente y cómo lo resolvemos).
3. Detalle de Servicios Propuestos.
4. Beneficios y ROI esperado.
5. Inversión (Tabla de precios o viñetas).
6. Próximos Pasos y Llamado a la Acción.

Solo responde con el código Markdown formateado, sin explicaciones adicionales fuera del documento.`;

        const userPrompt = `Por favor, redacta una propuesta para:
Empresa Cliente: ${empresa}
Atención a: ${contacto}
Servicios a ofrecer:
${serviciosOfrecidos.map((s: any) => `- ${s.nombre} (Valor ref: ${s.precio})`).join('\\n')}

Contexto adicional: ${contextoExtra || 'Elabora argumentos de venta convincentes para estos servicios.'}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.5,
            }
        });

        let propuestaMarkdown = response.text.trim();
        // Limpieza básica
        if (propuestaMarkdown.startsWith('```markdown')) propuestaMarkdown = propuestaMarkdown.replace(/^```markdown\\n?/, '');
        if (propuestaMarkdown.startsWith('```')) propuestaMarkdown = propuestaMarkdown.replace(/^```\\n?/, '');
        if (propuestaMarkdown.endsWith('```')) propuestaMarkdown = propuestaMarkdown.replace(/\\n?```$/, '');

        // Retornar el markdown y metadatos
        return {
            success: true,
            propuesta: propuestaMarkdown
        };

    } catch (error: any) {
        console.error('Error generando propuesta:', error);
        throw new HttpsError('internal', 'No se pudo generar la propuesta.', error.message);
    }
});
