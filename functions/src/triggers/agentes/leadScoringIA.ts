import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import { GoogleGenAI } from "@google/genai";
import { defineSecret } from "firebase-functions/params";

const geminiApiKey = defineSecret("GEMINI_API_KEY");

export const leadScoringIA = onDocumentCreated({
    document: "clientes/{clienteId}",
    secrets: [geminiApiKey],
    retry: false
}, async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
        console.log("No data associated with the event");
        return;
    }

    const cliente = snapshot.data();

    // Si ya tiene score manual o generado previamente, evitar ciclo
    if (cliente['scoringIA']) {
        return;
    }

    let webContentText = "";
    let tienePresenciaWeb = false;

    // Intents de Scraping Básico si hay sitio web
    // NOTA: Para producción se recomienda usar una API como Firecrawl o Jina Reader.
    // Esta es una implementación nativa basada en Fetch para extraer texto simple de la home.
    if (cliente['sitioWeb'] && typeof cliente['sitioWeb'] === 'string') {
        let url = cliente['sitioWeb'].trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        try {
            const response = await fetch(url, {
                // Timeouts u opciones restrictivas para no colgar la function
                signal: AbortSignal.timeout(5000)
            });
            if (response.ok) {
                const html = await response.text();
                // Extracción muy rudimentaria del body
                const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
                if (bodyMatch) {
                    webContentText = bodyMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 5000); // Max 5000 caracteres
                    tienePresenciaWeb = true;
                }
            }
        } catch (error) {
            console.warn(`Error haciendo fetch al sitio web de ${cliente['nombreEmpresa']}:`, error);
        }
    }

    // Preparar el Prompt para Gemini
    const systemPrompt = `Eres un asistente de ventas avanzado especializado en analizar clientes potenciales (Lead Scoring) B2B. Tu trabajo es predecir si un prospecto tiene alta probabilidad de cierre.

REGLAS:
1. Responde UNICAMENTE con un objeto JSON válido según la estructura definida. Sin texto adicional, sin código markdown \`\`\`json.
2. Analiza el nombre de la empresa, su giro, y el contenido de su sitio web si se proporciona.
3. El 'score' debe ser un número entero entre 0 y 100.
4. 'confianza' debe ser 'alta', 'media' o 'baja'.
5. 'factores' debe ser un arreglo de strings explicando por qué se le asignó ese score (ej: "Tiene sitio web activo", "Empresa grande detectada", "Poca presencia digital").
6. Proporcionar una recomendación y siguienteMejorAccion concisas (max 1 oración).
7. Extraer si es posible los datosExternos (empleadosEstimados, sectorDetectado, presenciaDigital).

ESTRUCTURA DEL JSON:
{
  "score": 0,
  "confianza": "alta",
  "factores": [],
  "recomendacion": "",
  "siguienteMejorAccion": "",
  "datosExternos": {
    "empleadosEstimados": "",
    "sectorDetectado": "",
    "presenciaDigital": "baja"
  }
}
`;

    const userPrompt = `Analiza al siguiente prospecto:
Nombre Empresa: ${cliente['nombreEmpresa'] || 'Desconocido'}
RUT/ID: ${cliente['rut'] || 'Desconocido'}
Giro/Industria: ${cliente['giro'] || 'No especificado'}
Sitio Web Declarado: ${cliente['sitioWeb'] || 'No'}
¿Pudimos extraer texto de su web?: ${tienePresenciaWeb ? 'Sí' : 'No'}

TEXTO DE LA WEB (Primeros 5000 caracteres):
${webContentText ? webContentText : 'No disponible.'}
`;

    try {
        const ai = new GoogleGenAI({
            apiKey: geminiApiKey.value()
        });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.1, // Baja temperatura para JSON predecible
            }
        });

        let responseText = (response.text || '{}').trim();
        // Limpiar posibles delimitadores markdown
        if (responseText.startsWith('```json')) responseText = responseText.replace(/^```json/, '');
        if (responseText.startsWith('```')) responseText = responseText.replace(/^```/, '');
        if (responseText.endsWith('```')) responseText = responseText.replace(/```$/, '');

        const parsedScoringIA = JSON.parse(responseText.trim());
        parsedScoringIA.fechaCalculo = admin.firestore.Timestamp.now();

        // Actualizar el documento del cliente en Firestore
        await snapshot.ref.update({
            scoringIA: parsedScoringIA,
            score: parsedScoringIA.score
        });

        console.log(`Lead Scoring IA ejecutado para ${cliente['id'] || snapshot.id} - Score: ${parsedScoringIA.score}`);

    } catch (error: any) {
        console.error(`Error procesando leadScoringIA para cliente ${snapshot.id}:`, error);
    }
});
