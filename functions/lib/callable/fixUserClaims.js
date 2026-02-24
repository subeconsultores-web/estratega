"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixUserClaims = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
/**
 * TEMPORARY admin function to fix user custom claims and create user documents.
 * Call via: https://us-central1-aulavirtual-dfb37.cloudfunctions.net/fixUserClaims?uid=XXX
 * After use, remove this function and redeploy.
 */
exports.fixUserClaims = functions.https.onRequest(async (req, res) => {
    var _a;
    const uid = req.query.uid;
    if (!uid) {
        res.status(400).json({ error: 'uid parameter required' });
        return;
    }
    try {
        const auth = admin.auth();
        const db = admin.firestore();
        // 1. Get user info
        const userRecord = await auth.getUser(uid);
        console.log('Processing user:', userRecord.email, 'UID:', uid);
        // 2. Check if user doc exists
        const userDoc = await db.collection('users').doc(uid).get();
        let tenantId;
        if (userDoc.exists && ((_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.tenantId)) {
            tenantId = userDoc.data().tenantId;
            console.log('Found existing tenantId in user doc:', tenantId);
        }
        else {
            // Check if there's already a tenant for this user
            const existingTenants = await db.collection('tenants')
                .where('email', '==', userRecord.email)
                .limit(1)
                .get();
            if (!existingTenants.empty) {
                tenantId = existingTenants.docs[0].id;
                console.log('Found existing tenant:', tenantId);
            }
            else {
                // Use UID as tenantId (matching the fallback behavior)
                tenantId = uid;
                console.log('Using UID as tenantId:', tenantId);
                // Create a tenant document
                await db.collection('tenants').doc(tenantId).set({
                    id: tenantId,
                    nombreEmpresa: 'Mi Empresa',
                    email: userRecord.email,
                    plan: 'free',
                    config: {
                        logoUrl: '',
                        colorPrimario: '#1A56DB',
                        colorSecundario: '#3F83F8',
                        moneda: 'CLP',
                        impuesto: 0.19,
                        correlativos: { cotizacion: 0, contrato: 0, factura: 0 }
                    },
                    limites: { usuarios: 3, almacenamientoMb: 500 },
                    suscripcion: {
                        estado: 'trial',
                        fechaInicio: admin.firestore.FieldValue.serverTimestamp(),
                        fechaRenovacion: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
                    },
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                console.log('Created tenant document');
            }
        }
        // 3. Set custom claims
        await auth.setCustomUserClaims(uid, {
            tenantId: tenantId,
            role: 'tenant_admin',
            plan: 'free'
        });
        console.log('Set custom claims with tenantId:', tenantId);
        // 4. Create/update user document
        await db.collection('users').doc(uid).set({
            uid,
            tenantId,
            email: userRecord.email,
            nombre: userRecord.displayName || userRecord.email,
            role: 'tenant_admin',
            activo: true,
            config: {
                idioma: 'es',
                notificaciones: { email: true, push: true }
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        console.log('Created/updated user document');
        // 5. Also check and report clientes data
        const clientesSnap = await db.collection('clientes')
            .where('tenantId', '==', tenantId)
            .limit(10)
            .get();
        const clientesCount = clientesSnap.size;
        const clientesList = clientesSnap.docs.map(d => ({
            id: d.id,
            tenantId: d.data().tenantId,
            empresa: d.data().nombreEmpresa
        }));
        // Also check clientes with no tenantId filter
        const allClientesSnap = await db.collection('clientes').limit(10).get();
        // Fix any clientes missing createdAt (needed for orderBy)
        const fixedDocs = [];
        for (const docSnap of allClientesSnap.docs) {
            const data = docSnap.data();
            if (!data.createdAt) {
                await docSnap.ref.update({
                    createdAt: data.updatedAt || admin.firestore.FieldValue.serverTimestamp()
                });
                fixedDocs.push(docSnap.id);
            }
        }
        res.json({
            success: true,
            user: {
                uid,
                email: userRecord.email,
                tenantId,
                claimsSet: { tenantId, role: 'tenant_admin', plan: 'free' }
            },
            clientes: {
                matchingTenantId: clientesCount,
                list: clientesList
            },
            allClientes: {
                total: allClientesSnap.size,
                list: allClientesSnap.docs.map(d => (Object.assign({ id: d.id }, d.data()))),
                fixedCreatedAt: fixedDocs
            },
            message: `Claims set. User must sign out and sign back in for changes to take effect.`
        });
    }
    catch (err) {
        console.error('Error fixing user:', err);
        res.status(500).json({ error: err.message });
    }
});
//# sourceMappingURL=fixUserClaims.js.map