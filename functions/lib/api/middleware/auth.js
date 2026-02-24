"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiKeyAuthMiddleware = void 0;
const admin = require("firebase-admin");
const apiKeyAuthMiddleware = async (req, res, next) => {
    const apiKey = req.header('x-api-key');
    if (!apiKey) {
        return res.status(401).json({ error: 'Unauthorized', message: 'Missing x-api-key header' });
    }
    try {
        const db = admin.firestore();
        const apiKeysSnapshot = await db.collection('apiKeys')
            .where('key', '==', apiKey)
            .where('isActive', '==', true)
            .limit(1)
            .get();
        if (apiKeysSnapshot.empty) {
            return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or revoked API Key' });
        }
        const keyDoc = apiKeysSnapshot.docs[0].data();
        req.tenantId = keyDoc.tenantId;
        // Actualizamos el último uso de forma asíncrona sin bloquear la respuesta
        db.collection('apiKeys').doc(apiKeysSnapshot.docs[0].id).update({
            lastUsedAt: admin.firestore.Timestamp.now()
        }).catch(console.error);
        return next();
    }
    catch (error) {
        console.error('API Key validation error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.apiKeyAuthMiddleware = apiKeyAuthMiddleware;
//# sourceMappingURL=auth.js.map