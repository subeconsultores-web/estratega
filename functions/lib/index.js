"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixUserClaims = exports.webhookDispatcherClientes = exports.api = exports.briefingSemanal = exports.generarSugerenciasUpselling = exports.generarPropuestaIA = exports.forecastPredictivo = exports.registerAgency = exports.askSubeIA = exports.analyzeDocument = exports.stripeWebhook = exports.createCheckoutSession = exports.generarPdf = exports.onCotizacionCreated = exports.leadScoringIA = exports.onActividadCreated = exports.onUserCreated = void 0;
const admin = require("firebase-admin");
admin.initializeApp();
// Triggers
var onUserCreated_1 = require("./triggers/onUserCreated");
Object.defineProperty(exports, "onUserCreated", { enumerable: true, get: function () { return onUserCreated_1.onUserCreated; } });
var onActividadCreated_1 = require("./triggers/onActividadCreated");
Object.defineProperty(exports, "onActividadCreated", { enumerable: true, get: function () { return onActividadCreated_1.onActividadCreated; } });
var leadScoringIA_1 = require("./triggers/agentes/leadScoringIA");
Object.defineProperty(exports, "leadScoringIA", { enumerable: true, get: function () { return leadScoringIA_1.leadScoringIA; } });
// Dummy mocks for other functions to satisfy structure
var onCotizacionCreated_1 = require("./triggers/onCotizacionCreated");
Object.defineProperty(exports, "onCotizacionCreated", { enumerable: true, get: function () { return onCotizacionCreated_1.onCotizacionCreated; } });
var generarPdf_1 = require("./callable/generarPdf");
Object.defineProperty(exports, "generarPdf", { enumerable: true, get: function () { return generarPdf_1.generarPdf; } });
var createCheckoutSession_1 = require("./callable/createCheckoutSession");
Object.defineProperty(exports, "createCheckoutSession", { enumerable: true, get: function () { return createCheckoutSession_1.createCheckoutSession; } });
var stripeWebhook_1 = require("./triggers/stripeWebhook");
Object.defineProperty(exports, "stripeWebhook", { enumerable: true, get: function () { return stripeWebhook_1.stripeWebhook; } });
var analyzeDocument_1 = require("./callable/analyzeDocument");
Object.defineProperty(exports, "analyzeDocument", { enumerable: true, get: function () { return analyzeDocument_1.analyzeDocument; } });
var askSubeIA_1 = require("./callable/askSubeIA");
Object.defineProperty(exports, "askSubeIA", { enumerable: true, get: function () { return askSubeIA_1.askSubeIA; } });
var registerAgency_1 = require("./callable/registerAgency");
Object.defineProperty(exports, "registerAgency", { enumerable: true, get: function () { return registerAgency_1.registerAgency; } });
var forecastPredictivo_1 = require("./callable/agentes/forecastPredictivo");
Object.defineProperty(exports, "forecastPredictivo", { enumerable: true, get: function () { return forecastPredictivo_1.forecastPredictivo; } });
var generarPropuestaIA_1 = require("./callable/agentes/generarPropuestaIA");
Object.defineProperty(exports, "generarPropuestaIA", { enumerable: true, get: function () { return generarPropuestaIA_1.generarPropuestaIA; } });
var generarSugerenciasUpselling_1 = require("./callable/agentes/generarSugerenciasUpselling");
Object.defineProperty(exports, "generarSugerenciasUpselling", { enumerable: true, get: function () { return generarSugerenciasUpselling_1.generarSugerenciasUpselling; } });
var briefingSemanal_1 = require("./scheduled/agentes/briefingSemanal");
Object.defineProperty(exports, "briefingSemanal", { enumerable: true, get: function () { return briefingSemanal_1.briefingSemanal; } });
// export { analizarDocumentoIA } from './triggers/agentes/analizarDocumentoIA';
// API Abierta (Ecosistema Sube)
var index_1 = require("./api/index");
Object.defineProperty(exports, "api", { enumerable: true, get: function () { return index_1.api; } });
var webhookDispatcher_1 = require("./triggers/webhooks/webhookDispatcher");
Object.defineProperty(exports, "webhookDispatcherClientes", { enumerable: true, get: function () { return webhookDispatcher_1.webhookDispatcherClientes; } });
// export { verificarCotizacionesExpiradas } from './scheduled/verificarCotizacionesExpiradas';
// TEMPORARY: Admin function to fix user claims (remove after use)
var fixUserClaims_1 = require("./callable/fixUserClaims");
Object.defineProperty(exports, "fixUserClaims", { enumerable: true, get: function () { return fixUserClaims_1.fixUserClaims; } });
//# sourceMappingURL=index.js.map