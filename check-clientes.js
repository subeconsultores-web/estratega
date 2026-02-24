// Quick script to check clientes data via the fixUserClaims endpoint
const https = require('https');

const url = 'https://us-central1-aulavirtual-dfb37.cloudfunctions.net/fixUserClaims?uid=mDt1lmLqkgfRhgZgnnhKXkbYGKg1';

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const json = JSON.parse(data);
        console.log('=== USER ===');
        console.log('UID:', json.user.uid);
        console.log('Email:', json.user.email);
        console.log('TenantId set:', json.user.tenantId);
        console.log('Claims:', JSON.stringify(json.user.claimsSet));

        console.log('\n=== CLIENTES matching tenantId ===');
        console.log('Count:', json.clientes.matchingTenantId);
        json.clientes.list.forEach(c => console.log('  -', c.id, '| tenantId:', c.tenantId, '| empresa:', c.empresa));

        console.log('\n=== ALL CLIENTES (any tenantId) ===');
        console.log('Count:', json.allClientes.total);
        json.allClientes.list.forEach(c => console.log('  -', c.id, '| tenantId:', c.tenantId, '| empresa:', c.empresa));

        console.log('\n=== MESSAGE ===');
        console.log(json.message);
    });
}).on('error', (e) => {
    console.error('Error:', e.message);
});
