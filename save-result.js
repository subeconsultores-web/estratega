const https = require('https');
const fs = require('fs');
const url = 'https://us-central1-aulavirtual-dfb37.cloudfunctions.net/fixUserClaims?uid=mDt1lmLqkgfRhgZgnnhKXkbYGKg1';
https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        fs.writeFileSync('clientes-result.json', data, 'utf-8');
        console.log('Saved to clientes-result.json');
    });
}).on('error', (e) => console.error('Error:', e.message));
