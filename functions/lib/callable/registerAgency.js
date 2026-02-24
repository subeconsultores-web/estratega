"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAgency = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
// Initialize admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp();
}
exports.registerAgency = (0, https_1.onCall)(async (request) => {
    var _a, _b;
    const uid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    const email = (_b = request.auth) === null || _b === void 0 ? void 0 : _b.token.email;
    if (!uid) {
        throw new https_1.HttpsError('unauthenticated', 'Debes estar autenticado para registrar una agencia.');
    }
    const { nombreAgencia, rutAgencia, telefono } = request.data;
    if (!nombreAgencia) {
        throw new https_1.HttpsError('invalid-argument', 'El nombre de la agencia es requerido.');
    }
    const db = admin.firestore();
    const auth = admin.auth();
    try {
        // 1. Verificar si el usuario ya tiene un tenant asignado
        const userRecord = await auth.getUser(uid);
        if (userRecord.customClaims && userRecord.customClaims['tenantId']) {
            throw new https_1.HttpsError('already-exists', 'Este usuario ya está asociado a una agencia.');
        }
        // 2. Crear el documento del Tenant
        const tenantRef = db.collection('tenants').doc();
        const tenantId = tenantRef.id;
        const tenantData = {
            id: tenantId,
            nombre: nombreAgencia,
            rut: rutAgencia || null,
            telefono: telefono || null,
            emailContacto: email || null,
            ownerUid: uid,
            isActive: true,
            plan: 'trial', // or 'free', 'pro'
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        await tenantRef.set(tenantData);
        // 3. Asignar Custom Claims al creador (role: admin, tenantId)
        const currentClaims = userRecord.customClaims || {};
        await auth.setCustomUserClaims(uid, Object.assign(Object.assign({}, currentClaims), { tenantId: tenantId, role: 'admin' }));
        // 4. Crear el registro del usuario en la colección de usuarios del tenant
        await db.collection('users').doc(uid).set({
            uid: uid,
            email: email,
            displayName: userRecord.displayName || nombreAgencia,
            tenantId: tenantId,
            role: 'admin',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return {
            success: true,
            tenantId: tenantId,
            message: 'Agencia registrada exitosamente. Por favor vuelve a iniciar sesión para aplicar los permisos.'
        };
    }
    catch (error) {
        console.error('Error registrando agencia:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Error interno al registrar la agencia.', error.message);
    }
});
//# sourceMappingURL=registerAgency.js.map