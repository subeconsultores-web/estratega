"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTeamMember = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
exports.createTeamMember = (0, https_1.onCall)(async (request) => {
    var _a, _b, _c, _d, _e;
    // 1. Verificar que el caller es admin
    const callerUid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    const callerRole = (_c = (_b = request.auth) === null || _b === void 0 ? void 0 : _b.token) === null || _c === void 0 ? void 0 : _c.role;
    const callerTenantId = (_e = (_d = request.auth) === null || _d === void 0 ? void 0 : _d.token) === null || _e === void 0 ? void 0 : _e.tenantId;
    if (!callerUid || !callerTenantId) {
        throw new https_1.HttpsError('unauthenticated', 'Debes estar autenticado.');
    }
    if (!['admin', 'tenant_admin', 'super_admin'].includes(callerRole)) {
        throw new https_1.HttpsError('permission-denied', 'Solo administradores pueden crear miembros del equipo.');
    }
    // 2. Validar input
    const { email, nombre, role, password } = request.data;
    if (!email || !nombre || !role) {
        throw new https_1.HttpsError('invalid-argument', 'email, nombre y rol son campos requeridos.');
    }
    const validRoles = ['admin', 'editor', 'viewer', 'vendedor', 'consultor', 'finanzas'];
    if (!validRoles.includes(role) && callerRole !== 'super_admin') {
        throw new https_1.HttpsError('invalid-argument', 'Rol inválido.');
    }
    const db = admin.firestore();
    const auth = admin.auth();
    // 3. Set default password if not provided
    const initialPassword = password || 'Subeia2024*';
    try {
        // 4. Crear usuario en Firebase Auth
        const userRecord = await auth.createUser({
            email,
            password: initialPassword,
            displayName: nombre,
            emailVerified: true, // Auto-verify internally created team members
        });
        const uid = userRecord.uid;
        // 5. Asignar Custom Claims inmediatos
        await auth.setCustomUserClaims(uid, {
            tenantId: callerTenantId,
            role: role
        });
        // 6. Escribir documento en /users/
        await db.collection('users').doc(uid).set({
            uid,
            tenantId: callerTenantId,
            email,
            nombre,
            role: role,
            activo: true,
            config: {
                idioma: 'es',
                notificaciones: {
                    email: true,
                    push: false,
                },
            },
            creadoPor: callerUid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`[createTeamMember] Usuario ${uid} (${role}) creado por ${callerUid}`);
        return {
            success: true,
            uid,
            message: `Usuario creado exitosamente. Contraseña inicial: ${initialPassword}`,
        };
    }
    catch (error) {
        console.error('[createTeamMember] Error:', error);
        if (error.code === 'auth/email-already-exists') {
            throw new https_1.HttpsError('already-exists', 'Ya existe un usuario con este correo electrónico.');
        }
        throw new https_1.HttpsError('internal', 'Error creando usuario de equipo.', error.message);
    }
});
//# sourceMappingURL=createTeamMember.js.map