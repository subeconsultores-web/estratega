"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const express = require("express");
const cors = require("cors");
const https_1 = require("firebase-functions/v2/https");
const auth_1 = require("./middleware/auth");
const clientes_1 = require("./routes/clientes");
const app = express();
// Middlewares globales
app.use(cors({ origin: true }));
app.use(express.json());
// Main API Route
// Middleware de autenticación global para /v1
app.use('/v1', auth_1.apiKeyAuthMiddleware);
// Rutas
app.use('/v1/clientes', clientes_1.clientesRouter);
// Exportar la aplicación Express envuelta en una Cloud Function
exports.api = (0, https_1.onRequest)({ region: 'us-central1' }, app);
//# sourceMappingURL=index.js.map