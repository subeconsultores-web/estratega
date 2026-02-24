"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientesRouter = void 0;
const express_1 = require("express");
const admin = require("firebase-admin");
exports.clientesRouter = (0, express_1.Router)();
exports.clientesRouter.get('/', async (req, res) => {
    const tenantId = req.tenantId;
    const db = admin.firestore();
    try {
        const snapshot = await db.collection('clientes')
            .where('tenantId', '==', tenantId)
            .limit(50)
            .get();
        const clientes = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        return res.status(200).json({ data: clientes });
    }
    catch (error) {
        return res.status(500).json({ error: 'Failed to fetch clientes' });
    }
});
exports.clientesRouter.post('/', async (req, res) => {
    const tenantId = req.tenantId;
    const db = admin.firestore();
    const data = req.body;
    try {
        const newClienteData = Object.assign(Object.assign({}, data), { tenantId, createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp(), estado: data.estado || 'lead', fuenteAdquisicion: data.fuenteAdquisicion || 'api' });
        const docRef = await db.collection('clientes').add(newClienteData);
        return res.status(201).json({
            success: true,
            data: Object.assign({ id: docRef.id }, newClienteData)
        });
    }
    catch (error) {
        return res.status(500).json({ error: 'Failed to create cliente' });
    }
});
//# sourceMappingURL=clientes.js.map