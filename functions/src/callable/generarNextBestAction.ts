import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { GoogleGenAI } from "@google/genai";
import { defineSecret } from "firebase-functions/params";

const geminiApiKey = defineSecret("GEMINI_API_KEY");

export const generarNextBestAction = onCall({
    secrets: [geminiApiKey],
    timeoutSeconds: 300,
    memory: "512MiB"
}, async (request) => {
    // 1. Verificación de Autenticación
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'El usuario debe estar autenticado para generar acciones.');
    }

    const clienteId = request.data.clienteId;
    if (!clienteId) {
        throw new HttpsError('invalid-argument', 'Se requiere el ID del cliente (clienteId).');
    }

    const db = admin.firestore();

    try {
        // 2. Obtener datos del Cliente
        const clienteDoc = await db.collection('clientes').doc(clienteId).get();
        if (!clienteDoc.exists) {
            throw new HttpsError('not-found', 'Cliente no encontrado.');
        }
        const cliente = clienteDoc.data()!;

        // 3. Obtener últimas actividades (máximo 5)
        const actividadesSnapshot = await db.collection('actividades')
            .where('clienteId', '==', clienteId)
            .orderBy('fecha', 'desc')
            .limit(5)
            .get();

        const actividades = actividadesSnapshot.docs.map(doc => {
            const data = doc.data();
            return `Fecha: ${data['fecha']?.toDate ? data['fecha'].toDate().toISOString().split('T')[0] : 'N/A'}, Tipo: ${data['tipoActividad']}, Título: ${data['titulo']}, Resumen: ${data['descripcion'] || 'Sin detalle'}`;
        });

        // 4. Obtener Oportunidades/Cotizaciones recientes (opcional, máximo 3)
        // Asumiendo que pueden estar en colección 'cotizaciones' o similar, 
        // pero por ahora usaremos la información básica que tengamos disponible o la omitiremos si es compleja.

        // 5. Construir el Prompt
        const systemPrompt = `Eres un asistente de ventas experto (Copiloto de Ventas) en un CRM B2B. Tu objetivo es analizar la situación actual de un lead/cliente basándote en su perfil y su historial de interacciones, y recomendar la "Siguiente Mejor Acción" (Next Best Action) que el ejecutivo de ventas debe tomar para avanzar o cerrar el trato.

REGLAS:
1. Responde UNICAMENTE con un objeto JSON válido.
2. Extrae la 'siguienteMejorAccion' (Acción directa y clara, max 10 a 15 palabras).
3. Escribe una 'justificacion' (Por qué sugieres esto basado en el contexto, max 2 oraciones).
4. Proporciona una sugerencia de asunto si la acción es contactar por correo ('asuntoSugerido', dejar vacío si no aplica).
5. Calcula un nuevo 'scorePredictivo' (0-100) basado en este historial reciente indicando qué tan caliente está el prospecto.

ESTRUCTURA DEL JSON:
{
  "siguienteMejorAccion": "Llamar para verificar recepción de propuesta",
  "justificacion": "El cliente recibió la propuesta hace 3 días y no ha respondido. Una llamada de seguimiento es apropiada.",
  "asuntoSugerido": "¿Dudas sobre la propuesta?",
  "scorePredictivo": 75
}`;

        const userPrompt = `Analiza este prospecto/cliente y sus interacciones recientes para sugerir la Siguiente Mejor Acción:

**Datos del Cliente:**
* Nombre/Empresa: ${cliente['nombreEmpresa'] || cliente['nombre'] || 'Desconocido'}
* Estado Actual: ${cliente['estado'] || 'No definido'}
* Sector/Giro: ${cliente['giro'] || 'No especificado'}
* Nivel de Interés (Manual): ${cliente['nivelInteres'] || 'No especificado'}
* Último AI Score guardado: ${cliente['scoringIA']?.score || cliente['score'] || 'N/A'}

**Últimas Interacciones (Actividades más recientes primero):**
${actividades.length > 0 ? actividades.join('\n') : '* No se registran interacciones previas con este cliente. Pareciera ser un lead nuevo.*'}

Genera tu análisis en formato JSON estricto.`;

        // 6. Llamar a Gemini
        const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.2, // Poca creatividad para respuestas consistentes
                responseMimeType: "application/json"
            }
        });

        // 7. Parsear e insertar resultado
        let responseText = (response.text || '{}').trim();
        // Fallback robusto por si el modelo devuelve markdown accidentalmente a pesar de responseMimeType
        if (responseText.startsWith('```json')) responseText = responseText.replace(/^```json/, '');
        if (responseText.startsWith('```')) responseText = responseText.replace(/^```/, '');
        if (responseText.endsWith('```')) responseText = responseText.replace(/```$/, '');

        const suggestionData = JSON.parse(responseText.trim());

        // 8. Opcional: Guardar esta sugerencia en la base de datos para historial o cacheo.
        // Guardaremos en el cliente la última sugerencia y actualizaremos su score.
        await db.collection('clientes').doc(clienteId).update({
            'nextBestActionIA': {
                siguienteMejorAccion: suggestionData.siguienteMejorAccion,
                justificacion: suggestionData.justificacion,
                asuntoSugerido: suggestionData.asuntoSugerido,
                fechaGeneracion: admin.firestore.Timestamp.now()
            },
            'score': suggestionData.scorePredictivo // Actualizamos el score general
        });

        console.log(`Next Best Action generado para cliente ${clienteId}`);

        return {
            success: true,
            data: suggestionData
        };

    } catch (error: any) {
        console.error(`Error en generarNextBestAction para cliente ${clienteId}:`, error);
        throw new HttpsError('internal', `Error al generar la recomendación de IA: ${error.message}`);
    }
});
