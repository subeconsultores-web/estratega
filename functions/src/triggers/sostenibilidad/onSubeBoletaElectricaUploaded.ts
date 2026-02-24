import { onObjectFinalized } from "firebase-functions/v2/storage";
import * as admin from "firebase-admin";

// NOTA PARA PRODUCCIÓN: Reemplazar el Mock por "@google-cloud/documentai" cuando se habilite la API en GCP
// import { DocumentProcessorServiceClient } from '@google-cloud/documentai';

export const onSubeBoletaElectricaUploaded = onObjectFinalized(
    {
        bucket: "estratega-subeia.firebasestorage.app", // Reemplazar con el default bucket
        cpu: 1,
        memory: "512MiB"
    },
    async (event) => {
        const fileBucket = event.data.bucket;
        const filePath = event.data.name;
        const contentType = event.data.contentType;

        // Validar que sea un PDF y que esté en la ruta correcta (ej: tenants/{id}/esg-docs/)
        if (!contentType?.startsWith('application/pdf')) {
            console.log('No es un PDF. Saliendo de Document AI Parser.');
            return;
        }

        if (!filePath.includes('/esg-docs/')) {
            console.log('Documento no subido a la carpeta ESG. Saliendo.');
            return;
        }

        // Extraer TenantId de la ruta: tenants/{tenantId}/esg-docs/...
        const pathSegments = filePath.split('/');
        const tenantsIndex = pathSegments.indexOf('tenants');
        const tenantId = tenantsIndex !== -1 ? pathSegments[tenantsIndex + 1] : null;

        if (!tenantId) {
            console.log('No se pudo extraer TenantID del archivo.');
            return;
        }

        console.log(`[DocumentAI ESG] Iniciando procesamiento para Tenant ${tenantId} | Archivo: ${filePath}`);

        try {
            // =========================================================================
            // LÓGICA MOCK DE EXTRACCIÓN (SUSTITUIR POR GOOGLE DOC AI REAL)
            // =========================================================================
            // Aquí llamaríamos a client.processDocument() pasándole el archivo del Storage

            // Simulación de OCR (factura eléctrica estándar chilena Enel/CGE)
            const consumoKwhExtraido = Math.floor(Math.random() * (2500 - 300 + 1) + 300);

            // =========================================================================
            // CÁLCULO HUELLA DE CARBONO (FACTOR SEN) -> 0.28 kgCO2eq/kWh approx
            // =========================================================================
            const factorEmision = 0.28;
            const huellaEmitida = parseFloat((consumoKwhExtraido * factorEmision).toFixed(2));

            const db = admin.firestore();

            // Grabar el registro subyacente en Firestore
            const registroESG = {
                tenantId: tenantId,
                tipoRecurso: 'electricidad',
                consumoBruto: consumoKwhExtraido,
                unidadMedida: 'kWh',
                fechaInicioPeriodo: admin.firestore.Timestamp.now(), // Normalmente extraerías esto del PDF
                fechaFinPeriodo: admin.firestore.Timestamp.now(),
                documentoFuenteId: filePath,
                factorEmisionUtilizado: factorEmision,
                huellaCarbonoKgCO2eq: huellaEmitida,
                fechaProcesamiento: admin.firestore.FieldValue.serverTimestamp(),
                procesadoPorAI: true
            };

            await db.collection('sostenibilidad').add(registroESG);

            console.log(`[ESG] Huella calculada: ${huellaEmitida}Kg de CO2eq. Grabado en Firestore.`);

        } catch (error) {
            console.error('[DocumentAI ESG] Error procesando boleta:', error);
        }
    }
);
