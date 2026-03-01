import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export const createTeamMember = onCall(async (request) => {
    // 1. Verificar que el caller es admin
    const callerUid = request.auth?.uid;
    const callerRole = request.auth?.token?.role;
    const callerTenantId = request.auth?.token?.tenantId;

    if (!callerUid || !callerTenantId) {
        throw new HttpsError('unauthenticated', 'Debes estar autenticado.');
    }

    if (!['admin', 'tenant_admin', 'super_admin'].includes(callerRole as string)) {
        throw new HttpsError('permission-denied', 'Solo administradores pueden crear miembros del equipo.');
    }

    // 2. Validar input
    const { email, nombre, role, password } = request.data;

    if (!email || !nombre || !role) {
        throw new HttpsError('invalid-argument', 'email, nombre y rol son campos requeridos.');
    }

    const validRoles = ['admin', 'editor', 'viewer', 'vendedor', 'consultor', 'finanzas'];
    if (!validRoles.includes(role) && callerRole !== 'super_admin') {
        throw new HttpsError('invalid-argument', 'Rol inválido.');
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
    } catch (error: any) {
        console.error('[createTeamMember] Error:', error);
        if (error.code === 'auth/email-already-exists') {
            throw new HttpsError('already-exists', 'Ya existe un usuario con este correo electrónico.');
        }
        throw new HttpsError('internal', 'Error creando usuario de equipo.', error.message);
    }
});
