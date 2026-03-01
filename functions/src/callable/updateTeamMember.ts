import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export const updateTeamMember = onCall(async (request) => {
    // 1. Verify caller is admin
    const callerUid = request.auth?.uid;
    const callerRole = request.auth?.token?.role;
    const callerTenantId = request.auth?.token?.tenantId;

    if (!callerUid || !callerTenantId) {
        throw new HttpsError('unauthenticated', 'Debes estar autenticado.');
    }

    if (!['admin', 'tenant_admin', 'super_admin'].includes(callerRole as string)) {
        throw new HttpsError('permission-denied', 'Solo administradores pueden modificar miembros del equipo.');
    }

    // 2. Validate input
    const { uid, nombre, role, password, activo } = request.data;

    if (!uid) {
        throw new HttpsError('invalid-argument', 'El UID del usuario es requerido.');
    }

    const validRoles = ['admin', 'editor', 'viewer', 'vendedor', 'consultor', 'finanzas'];
    if (role && !validRoles.includes(role) && callerRole !== 'super_admin') {
        throw new HttpsError('invalid-argument', 'Rol inválido.');
    }

    const db = admin.firestore();
    const auth = admin.auth();

    try {
        // 3. Verify user belongs to the same tenant (unless super_admin)
        const userDocRef = db.collection('users').doc(uid);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
            throw new HttpsError('not-found', 'Usuario no encontrado.');
        }

        const userData = userDoc.data();
        if (callerRole !== 'super_admin' && userData?.tenantId !== callerTenantId) {
            throw new HttpsError('permission-denied', 'No puedes modificar usuarios de otros equipos.');
        }

        // 4. Build updates
        const authUpdates: admin.auth.UpdateRequest = {};
        const firestoreUpdates: any = {};
        let updateClaims = false;
        let newClaims: any = {
            tenantId: userData?.tenantId
        };

        if (nombre !== undefined && nombre !== userData?.nombre) {
            authUpdates.displayName = nombre;
            firestoreUpdates.nombre = nombre;
        }

        if (password) {
            authUpdates.password = password;
        }

        if (activo !== undefined && activo !== userData?.activo) {
            authUpdates.disabled = !activo;
            firestoreUpdates.activo = activo;
        }

        if (role !== undefined && role !== userData?.role) {
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
        } catch (authError: any) {
            if (authError.code === 'auth/user-not-found') {
                console.log(`[updateTeamMember] User ${uid} not found in Auth. Creating it now...`);
                // Create user in Auth
                await auth.createUser({
                    uid,
                    email: userData?.email,
                    displayName: nombre !== undefined ? nombre : userData?.nombre,
                    password: password || 'Subeia2024*',
                    disabled: activo !== undefined ? !activo : !(userData?.activo !== false),
                    emailVerified: true
                });
                // Set custom claims
                await auth.setCustomUserClaims(uid, newClaims);
            } else {
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
    } catch (error: any) {
        console.error('[updateTeamMember] Error:', error);
        throw new HttpsError('internal', 'Error actualizando usuario de equipo.', error.message);
    }
});
