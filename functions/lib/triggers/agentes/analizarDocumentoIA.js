"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analizarDocumentoIA = void 0;
const storage_1 = require("firebase-functions/v2/storage");
const admin = require("firebase-admin");
const genai_1 = require("@google/genai");
const params_1 = require("firebase-functions/params");
const geminiApiKey = (0, params_1.defineSecret)("GEMINI_API_KEY");
exports.analizarDocumentoIA = (0, storage_1.onObjectFinalized)({
    secrets: [geminiApiKey]
}, async (event) => {
    var _a;
    const fileBucket = event.data.bucket;
    const filePath = event.data.name; // Ej: clientes/{tenantId}/{clienteId}/documentos/{fileId}.pdf
    const contentType = event.data.contentType;
    // Solo procesar si es en la carpeta de clientes y es PDF o Imagen
    if (!filePath.startsWith('clientes/') || !filePath.includes('/documentos/')) {
        return;
    }
    if (!(contentType === null || contentType === void 0 ? void 0 : contentType.startsWith('image/')) && contentType !== 'application/pdf') {
        console.log('El archivo no es analizable por IA (no es imagen ni PDF).');
        return;
    }
    try {
        // Extraer info de la ruta: clientes/TENANT_ID/CLIENTE_ID/documentos/FILE_NAME
        const pathSegments = filePath.split('/');
        if (pathSegments.length < 5)
            return;
        const clienteId = pathSegments[2];
        const fileName = pathSegments.pop();
        console.log(`Iniciando OCR IA para documento: ${fileName} del cliente: ${clienteId}`);
        const ai = new genai_1.GoogleGenAI({
            apiKey: geminiApiKey.value()
        });
        // Crear referencia URI de Google Cloud Storage
        const fileUri = `gs://${fileBucket}/${filePath}`;
        // Subir al modelo a través de File API no es necesario si le damos la gcs URI directa (soportado en GenAI)
        // Nota: El modelo flash soporta URIs de gs:// (Google Cloud Storage)
        const prompt = `Analiza este documento comercial. 
Identifica estructuradamente y en JSON plano:
{
  "tipoDocumento": "Contrato, Factura, Cotización, u Otro",
  "fechaEmision": "DD/MM/YYYY o N/A",
  "montoTotal": "Valor numérico o N/A",
  "partesInvolucradas": ["Nombre 1", "Nombre 2"],
  "resumen": "Resumen ejecutivo en 1 párrafo"
}

Si una parte no está, pon N/A. Responde ÚNICAMENTE con el formato JSON requerido.`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    role: 'user',
                    parts: [
                        { fileData: { fileUri: fileUri, mimeType: contentType } },
                        { text: prompt }
                    ]
                }
            ],
            config: {
                temperature: 0.1, // Baja temperatura para mayor exactitud en extracción
            }
        });
        let jsonRaw = ((_a = response.text) === null || _a === void 0 ? void 0 : _a.trim()) || '{}';
        // Limpiar backticks de markdown
        if (jsonRaw.startsWith('```json'))
            jsonRaw = jsonRaw.replace(/^```json\\n?/, '');
        if (jsonRaw.startsWith('```'))
            jsonRaw = jsonRaw.replace(/^```\\n?/, '');
        if (jsonRaw.endsWith('```'))
            jsonRaw = jsonRaw.replace(/\\n?```$/, '');
        const dataExtraida = JSON.parse(jsonRaw);
        // Guardar metadata en Firestore en una subcolección del cliente
        const db = admin.firestore();
        // Colección: clientes/{clienteId}/documentos (o algo similar)
        // Guardaremos en la misma estructura base que use la app. Para simplicidad:
        // Dado que puede ser clientes/clienteId o tenants/tenantId/clientes/clienteId, 
        // usaré CollectionGroup o una ruta estimada. 
        // Asumiendo top-level 'clientes' ya que en generarPropuesta usamos db.collection('clientes').doc(clienteId)
        const docRef = db.collection('clientes').doc(clienteId).collection('archivos').doc();
        await docRef.set({
            nombreArchivo: fileName,
            storagePath: filePath,
            bucket: fileBucket,
            contentType: contentType,
            fechaSubida: admin.firestore.Timestamp.now(),
            ocrData: {
                tipoDocumento: dataExtraida.tipoDocumento || 'Desconocido',
                fechaEmision: dataExtraida.fechaEmision || 'N/A',
                montoTotal: dataExtraida.montoTotal || 'N/A',
                partesInvolucradas: dataExtraida.partesInvolucradas || [],
                resumenCorto: dataExtraida.resumen || 'Sin resumen'
            },
            analizadoPorIA: true
        });
        console.log(`Documento ${fileName} analizado y metadata guardada.`);
    }
    catch (error) {
        console.error("Error en analizarDocumentoIA:", error);
    }
});
//# sourceMappingURL=analizarDocumentoIA.js.map