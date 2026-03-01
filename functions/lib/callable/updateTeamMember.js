"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTeamMember = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
exports.updateTeamMember = (0, https_1.onCall)(async (request) => {
    var _a, _b, _c, _d, _e;
    // 1. Verify caller is admin
    const callerUid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    const callerRole = (_c = (_b = request.auth) === null || _b === void 0 ? void 0 : _b.token) === null || _c === void 0 ? void 0 : _c.role;
    const callerTenantId = (_e = (_d = request.auth) === null || _d === void 0 ? void 0 : _d.token) === null || _e === void 0 ? void 0 : _e.tenantId;
    if (!callerUid || !callerTenantId) {
        throw new https_1.HttpsError('unauthenticated', 'Debes estar autenticado.');
    }
    if (!['admin', 'tenant_admin', 'super_admin'].includes(callerRole)) {
        throw new https_1.HttpsError('permission-denied', 'Solo administradores pueden modificar miembros del equipo.');
    }
    // 2. Validate input
    const { uid, nombre, role, password, activo } = request.data;
    if (!uid) {
        throw new https_1.HttpsError('invalid-argument', 'El UID del usuario es requerido.');
    }
    const validRoles = ['admin', 'editor', 'viewer', 'vendedor', 'consultor', 'finanzas'];
    if (role && !validRoles.includes(role) && callerRole !== 'super_admin') {
        throw new https_1.HttpsError('invalid-argument', 'Rol inválido.');
    }
    const db = admin.firestore();
    const auth = admin.auth();
    try {
        // 3. Verify user belongs to the same tenant (unless super_admin)
        const userDocRef = db.collection('users').doc(uid);
        const userDoc = await userDocRef.get();
        if (!userDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Usuario no encontrado.');
        }
        const userData = userDoc.data();
        if (callerRole !== 'super_admin' && (userData === null || userData === void 0 ? void 0 : userData.tenantId) !== callerTenantId) {
            throw new https_1.HttpsError('permission-denied', 'No puedes modificar usuarios de otros equipos.');
        }
        // 4. Build updates
        const authUpdates = {};
        const firestoreUpdates = {};
        let updateClaims = false;
        let newClaims = {
            tenantId: userData === null || userData === void 0 ? void 0 : userData.tenantId
        };
        if (nombre !== undefined && nombre !== (userData === null || userData === void 0 ? void 0 : userData.nombre)) {
            authUpdates.displayName = nombre;
            firestoreUpdates.nombre = nombre;
        }
        if (password) {
            authUpdates.password = password;
        }
        if (activo !== undefined && activo !== (userData === null || userData === void 0 ? void 0 : userData.activo)) {
            authUpdates.disabled = !activo;
            firestoreUpdates.activo = activo;
        }
        if (role !== undefined && role !== (userData === null || userData === void 0 ? void 0 : userData.role)) {
            updateClaims = true;
            newClaims.role = role;
            firestoreUpdates.role = role;
        }
        // 5 & 6. Apply Auth upates and Claims
        try {
            if (Object.keys(authUpdates).length > 0) {
                await auth.updateUser(uid, authUpdates);
            }
            if (updateClaims) {
                await auth.setCustomUserClaims(uid, newClaims);
            }
        }
        catch (authError) {
            if (authError.code === 'auth/user-not-found') {
                console.log(`[updateTeamMember] User ${uid} not found in Auth. Creating it now...`);
                // Create user in Auth
                await auth.createUser({
                    uid,
                    email: userData === null || userData === void 0 ? void 0 : userData.email,
                    displayName: nombre !== undefined ? nombre : userData === null || userData === void 0 ? void 0 : userData.nombre,
                    password: password || 'Subeia2024*',
                    disabled: activo !== undefined ? !activo : !((userData === null || userData === void 0 ? void 0 : userData.activo) !== false),
                    emailVerified: true
                });
                // Set custom claims
                await auth.setCustomUserClaims(uid, newClaims);
            }
            else {
                throw authError;
            }
        }
        // 7. Update Firestore
        if (Object.keys(firestoreUpdates).length > 0) {
            firestoreUpdates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
            firestoreUpdates.actualizadoPor = callerUid;
            await userDocRef.update(firestoreUpdates);
        }
        console.log(`[updateTeamMember] Usuario ${uid} actualizado por ${callerUid}`);
        return {
            success: true,
            message: 'Usuario actualizado exitosamente.',
        };
    }
    catch (error) {
        console.error('[updateTeamMember] Error:', error);
        throw new https_1.HttpsError('internal', 'Error actualizando usuario de equipo.', error.message);
    }
});
//# sourceMappingURL=updateTeamMember.js.map