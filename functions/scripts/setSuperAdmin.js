const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Verifica si existe el archivo de clave de servicio
const serviceAccountPath = path.resolve(__dirname, '../service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
    console.error('\n❌ ERROR: Falta el archivo "service-account.json" en la carpeta functions/.');
    console.error('Debes descargarlo desde Configuración del Proyecto > Cuentas de Servicio en Firebase Console.');
    process.exit(1);
}

// Inicializar app
admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath))
});

const args = process.argv.slice(2);
const targetUid = args[0];

if (!targetUid) {
    console.error('\nUso: node setSuperAdmin.js <UID_DEL_USUARIO>');
    console.error('Ejemplo: node setSuperAdmin.js aB3cD4eF5gH6...');
    process.exit(1);
}

async function setSuperAdmin() {
    try {
        console.log(`\nBuscando usuario con UID: ${targetUid}...`);
        const user = await admin.auth().getUser(targetUid);

        console.log(`Usuario encontrado: ${user.email}`);

        const currentClaims = user.customClaims || {};

        // Agregar claim superadmin
        const newClaims = {
            ...currentClaims,
            role: 'superadmin'
        };

        if (newClaims.tenantId) {
            console.log(`⚠️  El usuario tenía tenantId = ${newClaims.tenantId}. Como superadmin, esto se ignora o se puede eliminar, pero lo preservaremos intacto.`);
        }

        await admin.auth().setCustomUserClaims(targetUid, newClaims);

        console.log(`\n✅ ÉXITO: El usuario ${user.email} ahora tiene permisos globales de 'superadmin'.`);
        console.log(`Pídele al usuario que cierre sesión y vuelva a entrar para que se actualice su token.\n`);

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error al actualizar el usuario:');
        console.error(error.message);
        process.exit(1);
    }
}

setSuperAdmin();
