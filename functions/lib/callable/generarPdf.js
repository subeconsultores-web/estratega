"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generarPdf = void 0;
const functions = require("firebase-functions/v2");
exports.generarPdf = functions.https.onCall(async (request) => {
    // Validar Auth
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const { cotizacionId } = request.data;
    if (!cotizacionId) {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a valid cotizacionId.');
    }
    try {
        console.log(`Iniciando generación de PDF para cotizacion ${cotizacionId}`);
        // --- SKELETON PARA PUPPETEER ---
        // 1. const browser = await puppeteer.launch({ headless: 'new' });
        // 2. const page = await browser.newPage();
        // 3. await page.setContent(htmlContent || '<html><body>PDF Mock</body></html>');
        // 4. const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        // 5. await browser.close();
        // --- SKELETON PARA FIREBASE STORAGE ---
        // 1. const bucket = admin.storage().bucket();
        // 2. const file = bucket.file(`tenants/${tenantId}/cotizaciones/${cotizacionId}.pdf`);
        // 3. await file.save(pdfBuffer, { contentType: 'application/pdf' });
        // 4. const [url] = await file.getSignedUrl({ action: 'read', expires: '03-09-2499' });
        return {
            success: true,
            url: `https://storage.googleapis.com/mock-bucket/mock-cotizacion-${cotizacionId}.pdf`,
            message: 'PDF generado exitosamente (MOCK)'
        };
    }
    catch (error) {
        console.error('Error generando PDF:', error);
        throw new functions.https.HttpsError('internal', 'No se ha podido procesar el PDF documental');
    }
});
//# sourceMappingURL=generarPdf.js.map