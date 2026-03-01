import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

/**
 * createClientUser — Callable Cloud Function
 *
 * Permite a un admin/tenant_admin crear un usuario-cliente
 * vinculado a un registro CRM existente en /clientes/.
 *
 * Input: { email, nombre, clienteId }
 * Output: { success, uid, resetLink }
 */
export const createClientUser = onCall(async (request) => {
    // 1. Verificar que el caller es admin
    const callerUid = request.auth?.uid;
    const callerRole = request.auth?.token?.role;
    const callerTenantId = request.auth?.token?.tenantId;

    if (!callerUid || !callerTenantId) {
        throw new HttpsError('unauthenticated', 'Debes estar autenticado.');
    }

    if (!['admin', 'tenant_admin', 'super_admin'].includes(callerRole as string)) {
        throw new HttpsError('permission-denied', 'Solo administradores pueden crear usuarios-cliente.');
    }

    // 2. Validar input
    const { email, nombre, clienteId } = request.data;

    if (!email || !nombre || !clienteId) {
        throw new HttpsError('invalid-argument', 'email, nombre y clienteId son campos requeridos.');
    }

    const db = admin.firestore();
    const auth = admin.auth();

    // 3. Verificar que el clienteId existe y pertenece al tenant del caller
    const clienteDoc = await db.collection('clientes').doc(clienteId).get();
    if (!clienteDoc.exists) {
        throw new HttpsError('not-found', `Cliente ${clienteId} no encontrado.`);
    }

    const clienteData = clienteDoc.data()!;
    if (clienteData.tenantId !== callerTenantId) {
        throw new HttpsError('permission-denied', 'El cliente no pertenece a tu organización.');
    }

    // 4. Verificar que no existe ya un usuario con ese email
    try {
        const existingUser = await auth.getUserByEmail(email);
        // Si ya existe, verificar si ya es un client de este tenant
        const existingDoc = await db.collection('users').doc(existingUser.uid).get();
        if (existingDoc.exists) {
            const userData = existingDoc.data()!;
            if (userData.role === 'client' && userData.clienteId === clienteId) {
                throw new HttpsError('already-exists', 'Este cliente ya tiene una cuenta de portal activa.');
            }
            throw new HttpsError('already-exists', 'Ya existe un usuario con este email en el sistema.');
        }
    } catch (error: any) {
        // auth/user-not-found es OK — significa que podemos crear el usuario
        if (error.code !== 'auth/user-not-found' && !(error instanceof HttpsError)) {
            throw new HttpsError('internal', 'Error verificando email existente.', error.message);
        }
        if (error instanceof HttpsError) throw error;
    }

    try {
        // 5. Crear usuario en Firebase Auth con contraseña temporal segura
        const tempPassword = crypto.randomBytes(16).toString('hex');

        const userRecord = await auth.createUser({
            email,
            password: tempPassword,
            displayName: nombre,
            emailVerified: false,
        });

        const uid = userRecord.uid;

        // 6. Escribir documento en /users/
        await db.collection('users').doc(uid).set({
            uid,
            tenantId: callerTenantId,
            email,
            nombre,
            role: 'client',
            clienteId,
            activo: true,
            config: {
                idioma: 'es',
                notificaciones: {
                    email: true,
                    push: false,
                },
            },
            invitadoPor: callerUid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // 7. Asignar Custom Claims
        await auth.setCustomUserClaims(uid, {
            tenantId: callerTenantId,
            role: 'client',
            clienteId,
        });

        // 8. Generar link de reset de contraseña (actúa como "invitación")
        const resetLink = await auth.generatePasswordResetLink(email);

        // 9. Actualizar el registro del cliente CRM con referencia al usuario portal
        await db.collection('clientes').doc(clienteId).update({
            portalUserId: uid,
            portalActivo: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`[createClientUser] Cliente ${clienteId} → usuario portal ${uid} creado por ${callerUid}`);

        return {
            success: true,
            uid,
            resetLink,
            message: `Invitación enviada a ${email}. El cliente debe establecer su contraseña para acceder al portal.`,
        };
    } catch (error: any) {
        console.error('[createClientUser] Error:', error);
        throw new HttpsError('internal', 'Error creando usuario-cliente.', error.message);
    }
});
