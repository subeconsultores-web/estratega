import * as express from 'express';
import * as cors from 'cors';
import { onRequest } from 'firebase-functions/v2/https';
import { apiKeyAuthMiddleware } from './middleware/auth';
import { clientesRouter } from './routes/clientes';

const app = express();

// Middlewares globales
app.use(cors({ origin: true }));
app.use(express.json());

// Main API Route
// Middleware de autenticación global para /v1
app.use('/v1', apiKeyAuthMiddleware);

// Rutas
app.use('/v1/clientes', clientesRouter);

// Exportar la aplicación Express envuelta en una Cloud Function
export const api = onRequest({ region: 'us-central1' }, app);
