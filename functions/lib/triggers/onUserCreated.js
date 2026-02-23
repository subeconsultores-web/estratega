"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onUserCreated = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
    const { uid, email, displayName } = user;
    // Obtener datos adicionales del registro (guardados temporalmente)
    const registroDoc = await admin.firestore()
        .collection('_registros_temp')
        .doc(email)
        .get();
    if (!registroDoc.exists) {
        console.error('No se encontraron datos de registro para', email);
        return;
    }
    const registroData = registroDoc.data();
    const tenantId = admin.firestore().collection('tenants').doc().id;
    const batch = admin.firestore().batch();
    // 1. Crear documento de tenant
    const tenantRef = admin.firestore().collection('tenants').doc(tenantId);
    batch.set(tenantRef, {
        id: tenantId,
        nombreEmpresa: registroData.nombreEmpresa,
        rut: registroData.rut,
        giro: registroData.giro || '',
        direccion: registroData.direccion || '',
        telefono: registroData.telefono || '',
        email: email,
        sitioWeb: registroData.sitioWeb || '',
        plan: 'free',
        config: {
            logoUrl: '',
            colorPrimario: '#1A56DB',
            colorSecundario: '#3F83F8',
            moneda: 'CLP',
            impuesto: 0.19,
            correlativos: {
                cotizacion: 0,
                contrato: 0,
                factura: 0
            }
        },
        limites: {
            usuarios: 3,
            almacenamientoMb: 500
        },
        suscripcion: {
            estado: 'trial',
            fechaInicio: admin.firestore.FieldValue.serverTimestamp(),
            fechaRenovacion: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
            )
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    // 2. Crear documento de usuario
    const userRef = admin.firestore().collection('users').doc(uid);
    batch.set(userRef, {
        uid,
        tenantId,
        email: email,
        nombre: displayName || registroData.nombre,
        role: 'tenant_admin',
        activo: true,
        config: {
            idioma: 'es',
            notificaciones: {
                email: true,
                push: true
            }
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    // 3. Ejecutar batch
    await batch.commit();
    // 4. Asignar Custom Claims
    await admin.auth().setCustomUserClaims(uid, {
        tenantId,
        role: 'tenant_admin',
        plan: 'free'
    });
    // 5. Limpiar registro temporal
    await registroDoc.ref.delete();
    console.log(`Tenant ${tenantId} creado para usuario ${uid}`);
});
//# sourceMappingURL=onUserCreated.js.map