const admin = require('firebase-admin');

// Initialize with default credentials (from gcloud or service account)
const app = admin.initializeApp({
    projectId: 'aulavirtual-dfb37'
});

const db = admin.firestore();
const auth = admin.auth();

const TARGET_UID = 'mDt1lmLqkgfRhgZgnnhKXkbYGKg1';

async function main() {
    try {
        // 1. Get user info
        console.log('=== 1. Checking Auth User ===');
        const userRecord = await auth.getUser(TARGET_UID);
        console.log('Email:', userRecord.email);
        console.log('Display Name:', userRecord.displayName);
        console.log('Custom Claims:', JSON.stringify(userRecord.customClaims));

        // 2. Check users/{uid} document
        console.log('\n=== 2. Checking Firestore users/' + TARGET_UID + ' ===');
        const userDoc = await db.collection('users').doc(TARGET_UID).get();
        if (userDoc.exists) {
            const data = userDoc.data();
            console.log('User doc exists. tenantId:', data.tenantId);
            console.log('Full data:', JSON.stringify(data, null, 2));
        } else {
            console.log('User doc DOES NOT EXIST');
        }

        // 3. Check tenants collection
        console.log('\n=== 3. Checking tenants collection ===');
        const tenantsSnap = await db.collection('tenants').limit(5).get();
        console.log('Total tenants found:', tenantsSnap.size);
        tenantsSnap.forEach(doc => {
            const d = doc.data();
            console.log(`  Tenant ${doc.id}: email=${d.email}, empresa=${d.nombreEmpresa}`);
        });

        // 4. Check clientes collection
        console.log('\n=== 4. Checking clientes collection ===');
        const clientesSnap = await db.collection('clientes').limit(5).get();
        console.log('Total clientes found:', clientesSnap.size);
        clientesSnap.forEach(doc => {
            const d = doc.data();
            console.log(`  Cliente ${doc.id}: tenantId=${d.tenantId}, empresa=${d.nombreEmpresa}`);
        });

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        process.exit(0);
    }
}

main();
