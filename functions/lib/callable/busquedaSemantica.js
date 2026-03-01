"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.busquedaSemantica = void 0;
const admin = require("firebase-admin");
const https_1 = require("firebase-functions/v2/https");
const genai_1 = require("@google/genai");
const db = admin.firestore();
/**
 * Búsqueda semántica con Gemini.
 * Recibe un query en lenguaje natural, lo interpreta con IA,
 * y ejecuta queries contra Firestore para encontrar resultados relevantes.
 */
exports.busquedaSemantica = (0, https_1.onCall)({
    cors: true,
    memory: '256MiB',
    maxInstances: 10
}, async (request) => {
    var _a, _b, _c, _d;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Autenticación requerida.');
    }
    const tenantId = request.auth.token['tenantId'];
    if (!tenantId) {
        throw new https_1.HttpsError('permission-denied', 'No se encontró tenantId.');
    }
    const { query } = request.data;
    if (!query || typeof query !== 'string' || query.trim().length < 3) {
        throw new https_1.HttpsError('invalid-argument', 'Se requiere un query de al menos 3 caracteres.');
    }
    try {
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            throw new https_1.HttpsError('failed-precondition', 'API Key no configurada.');
        }
        const ai = new genai_1.GoogleGenAI({ apiKey });
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
        let interpretacion;
        try {
            const rawText = interpretResult.text || '{}';
            const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            interpretacion = JSON.parse(cleaned);
        }
        catch (_e) {
            interpretacion = {
                entidades: ['cliente', 'proyecto', 'factura'],
                filtros: { terminos: query.split(' ').filter((w) => w.length > 2) },
                intencion: query
            };
        }
        // Step 2: Query Firestore based on interpretation
        const resultados = [];
        const terminos = (((_a = interpretacion.filtros) === null || _a === void 0 ? void 0 : _a.terminos) || []).map((t) => t.toLowerCase());
        // Search clientes
        if ((_b = interpretacion.entidades) === null || _b === void 0 ? void 0 : _b.includes('cliente')) {
            const snap = await db.collection('clientes')
                .where('tenantId', '==', tenantId)
                .limit(50)
                .get();
            snap.forEach(doc => {
                var _a;
                const c = doc.data();
                const texto = `${c.nombreEmpresa || ''} ${c.giro || ''} ${((_a = c.contactoPrincipal) === null || _a === void 0 ? void 0 : _a.email) || ''} ${c.estado || ''}`.toLowerCase();
                const matches = terminos.some((t) => texto.includes(t));
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
        if ((_c = interpretacion.entidades) === null || _c === void 0 ? void 0 : _c.includes('proyecto')) {
            const snap = await db.collection('proyectos')
                .where('tenantId', '==', tenantId)
                .limit(50)
                .get();
            snap.forEach(doc => {
                const p = doc.data();
                const texto = `${p.nombre || ''} ${p.descripcion || ''} ${p.estado || ''}`.toLowerCase();
                const matches = terminos.some((t) => texto.includes(t));
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
        if ((_d = interpretacion.entidades) === null || _d === void 0 ? void 0 : _d.includes('cotizacion')) {
            const snap = await db.collection('cotizaciones')
                .where('tenantId', '==', tenantId)
                .limit(50)
                .get();
            snap.forEach(doc => {
                const cot = doc.data();
                const texto = `${cot.codigoFormateado || ''} ${cot.estado || ''} ${cot.clienteNombre || ''}`.toLowerCase();
                const matches = terminos.some((t) => texto.includes(t));
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
    }
    catch (error) {
        console.error('Error en búsqueda semántica:', error);
        if (error instanceof https_1.HttpsError)
            throw error;
        throw new https_1.HttpsError('internal', 'Error procesando la búsqueda semántica.');
    }
});
//# sourceMappingURL=busquedaSemantica.js.map