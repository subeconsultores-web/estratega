// Quick helper to check Firestore data using Firebase CLI auth token
const { execSync } = require('child_process');

// Get the access token from Firebase CLI
const token = execSync('npx firebase-tools@latest login:ci --interactive 2>&1 || echo ""', { encoding: 'utf-8' });

// Use the REST API with Firebase CLI's stored auth
const https = require('https');

function firestoreGet(path) {
    return new Promise((resolve, reject) => {
        // Read firebase CLI token from config
        const configPath = require('path').join(require('os').homedir(), '.config', 'configstore', 'firebase-tools.json');
        let config;
        try {
            config = JSON.parse(require('fs').readFileSync(configPath, 'utf-8'));
        } catch (e) {
            // Try Windows path
            const winPath = require('path').join(process.env.APPDATA || '', 'configstore', 'firebase-tools.json');
            config = JSON.parse(require('fs').readFileSync(winPath, 'utf-8'));
        }

        const accessToken = config.tokens?.access_token || config.tokens?.refresh_token;
        if (!accessToken) {
            reject(new Error('No access token found'));
            return;
        }

        const url = `https://firestore.googleapis.com/v1/projects/aulavirtual-dfb37/databases/(default)/documents/${path}`;

        const req = https.get(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        });
        req.on('error', reject);
    });
}

async function main() {
    try {
        // Check users doc
        console.log('=== Users Doc ===');
        const userDoc = await firestoreGet('users/mDt1lmLqkgfRhgZgnnhKXkbYGKg1');
        console.log(JSON.stringify(userDoc, null, 2));

        // Check tenants
        console.log('\n=== Tenants ===');
        const tenants = await firestoreGet('tenants');
        console.log(JSON.stringify(tenants, null, 2));

        // Check clientes
        console.log('\n=== Clientes ===');
        const clientes = await firestoreGet('clientes');
        console.log(JSON.stringify(clientes, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
    }
    process.exit(0);
}

main();
