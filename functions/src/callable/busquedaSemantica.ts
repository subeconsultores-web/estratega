import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { GoogleGenAI } from '@google/genai';

const db = admin.firestore();

/**
 * Búsqueda semántica con Gemini.
 * Recibe un query en lenguaje natural, lo interpreta con IA,
 * y ejecuta queries contra Firestore para encontrar resultados relevantes.
 */
export const busquedaSemantica = onCall({
    cors: true,
    memory: '256MiB',
    maxInstances: 10
}, async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Autenticación requerida.');
    }

    const tenantId = request.auth.token['tenantId'];
    if (!tenantId) {
        throw new HttpsError('permission-denied', 'No se encontró tenantId.');
    }

    const { query } = request.data;
    if (!query || typeof query !== 'string' || query.trim().length < 3) {
        throw new HttpsError('invalid-argument', 'Se requiere un query de al menos 3 caracteres.');
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            throw new HttpsError('failed-precondition', 'API Key no configurada.');
        }

        const ai = new GoogleGenAI({ apiKey });

        // Step 1: Use Gemini to interpret the natural language query
        const interpretPrompt = `Eres un motor de búsqueda semántica para un sistema de gestión empresarial.
El usuario busca: "${query}"

Analiza la intención y responde SOLO con un JSON válido (sin markdown) con esta estructura:
{
  "entidades": ["cliente", "proyecto", "factura", "cotizacion"],
  "filtros": {
    "estado": null,
    "sector": null,
    "terminos": ["palabra1", "palabra2"]
  },
  "intencion": "descripción breve de lo que busca el usuario"
}

Reglas:
- "entidades" debe incluir SOLO las colecciones relevantes al query
- "terminos" son las palabras clave para buscar en campos de texto
- Si el query menciona un estado (activo, pendiente, etc), ponlo en "estado"
- Si menciona un sector o industria, ponlo en "sector"`;

        const interpretResult = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: interpretPrompt
        });

        let interpretacion: any;
        try {
            const rawText = interpretResult.text || '{}';
            const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            interpretacion = JSON.parse(cleaned);
        } catch {
            interpretacion = {
                entidades: ['cliente', 'proyecto', 'factura'],
                filtros: { terminos: query.split(' ').filter((w: string) => w.length > 2) },
                intencion: query
            };
        }

        // Step 2: Query Firestore based on interpretation
        const resultados: any[] = [];
        const terminos = (interpretacion.filtros?.terminos || []).map((t: string) => t.toLowerCase());

        // Search clientes
        if (interpretacion.entidades?.includes('cliente')) {
            const snap = await db.collection('clientes')
                .where('tenantId', '==', tenantId)
                .limit(50)
                .get();

            snap.forEach(doc => {
                const c = doc.data();
                const texto = `${c.nombreEmpresa || ''} ${c.giro || ''} ${c.contactoPrincipal?.email || ''} ${c.estado || ''}`.toLowerCase();
                const matches = terminos.some((t: string) => texto.includes(t));
                if (matches || terminos.length === 0) {
                    resultados.push({
                        id: doc.id,
                        type: 'cliente',
                        title: c.nombreEmpresa || 'Sin nombre',
                        subtitle: `${c.giro || 'Sin sector'} · ${c.estado || ''}`,
                        route: `/crm/clientes/${doc.id}`,
                        relevancia: matches ? 'alta' : 'media'
                    });
                }
            });
        }

        // Search proyectos
        if (interpretacion.entidades?.includes('proyecto')) {
            const snap = await db.collection('proyectos')
                .where('tenantId', '==', tenantId)
                .limit(50)
                .get();

            snap.forEach(doc => {
                const p = doc.data();
                const texto = `${p.nombre || ''} ${p.descripcion || ''} ${p.estado || ''}`.toLowerCase();
                const matches = terminos.some((t: string) => texto.includes(t));
                if (matches || terminos.length === 0) {
                    resultados.push({
                        id: doc.id,
                        type: 'proyecto',
                        title: p.nombre || 'Sin nombre',
                        subtitle: `Estado: ${p.estado || 'N/A'}`,
                        route: `/proyectos/${doc.id}`,
                        relevancia: matches ? 'alta' : 'media'
                    });
                }
            });
        }

        // Search cotizaciones
        if (interpretacion.entidades?.includes('cotizacion')) {
            const snap = await db.collection('cotizaciones')
                .where('tenantId', '==', tenantId)
                .limit(50)
                .get();

            snap.forEach(doc => {
                const cot = doc.data();
                const texto = `${cot.codigoFormateado || ''} ${cot.estado || ''} ${cot.clienteNombre || ''}`.toLowerCase();
                const matches = terminos.some((t: string) => texto.includes(t));
                if (matches || terminos.length === 0) {
                    resultados.push({
                        id: doc.id,
                        type: 'cotizacion',
                        title: `Cotización ${cot.codigoFormateado || doc.id}`,
                        subtitle: `${cot.clienteNombre || 'S/N'} · $${cot.totalFinal || 0}`,
                        route: `/cotizaciones/${doc.id}`,
                        relevancia: matches ? 'alta' : 'media'
                    });
                }
            });
        }

        // Sort by relevancia
        resultados.sort((a, b) => (a.relevancia === 'alta' ? -1 : 1) - (b.relevancia === 'alta' ? -1 : 1));

        return {
            success: true,
            data: {
                resultados: resultados.slice(0, 15),
                totalResultados: resultados.length,
                intencion: interpretacion.intencion || query,
                query
            }
        };

    } catch (error: any) {
        console.error('Error en búsqueda semántica:', error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError('internal', 'Error procesando la búsqueda semántica.');
    }
});
