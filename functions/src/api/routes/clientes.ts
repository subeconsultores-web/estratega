import { Router, Request, Response } from 'express';
import * as admin from 'firebase-admin';

export const clientesRouter = Router();

clientesRouter.get('/', async (req: Request, res: Response): Promise<any> => {
    const tenantId = req.tenantId;
    const db = admin.firestore();

    try {
        const snapshot = await db.collection('clientes')
            .where('tenantId', '==', tenantId)
            .limit(50)
            .get();

        const clientes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return res.status(200).json({ data: clientes });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch clientes' });
    }
});

clientesRouter.post('/', async (req: Request, res: Response): Promise<any> => {
    const tenantId = req.tenantId;
    const db = admin.firestore();
    const data = req.body;

    try {
        const newClienteData = {
            ...data,
            tenantId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            estado: data.estado || 'lead',
            fuenteAdquisicion: data.fuenteAdquisicion || 'api'
        };

        const docRef = await db.collection('clientes').add(newClienteData);

        return res.status(201).json({
            success: true,
            data: { id: docRef.id, ...newClienteData }
        });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to create cliente' });
    }
});
