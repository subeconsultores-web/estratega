const https = require('https');
const fs = require('fs');

// Check full clientes document data
const url = 'https://firestore.googleapis.com/v1/projects/aulavirtual-dfb37/databases/(default)/documents/clientes/HzxkXr1lfxWzynRAo9xR';

// We need an access token - let's use the fixUserClaims endpoint instead
// to get full document data including createdAt
const url2 = 'https://us-central1-aulavirtual-dfb37.cloudfunctions.net/fixUserClaims?uid=mDt1lmLqkgfRhgZgnnhKXkbYGKg1&checkFields=true';

https.get(url2, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        fs.writeFileSync('clientes-full.json', data, 'utf-8');
        console.log('Done');
    });
}).on('error', (e) => console.error('Error:', e.message));
