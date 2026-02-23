"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.askSubeIA = exports.analyzeDocument = exports.stripeWebhook = exports.createCheckoutSession = exports.generarPdf = exports.onCotizacionCreated = exports.onActividadCreated = exports.onUserCreated = void 0;
const admin = require("firebase-admin");
admin.initializeApp();
// Triggers
var onUserCreated_1 = require("./triggers/onUserCreated");
Object.defineProperty(exports, "onUserCreated", { enumerable: true, get: function () { return onUserCreated_1.onUserCreated; } });
var onActividadCreated_1 = require("./triggers/onActividadCreated");
Object.defineProperty(exports, "onActividadCreated", { enumerable: true, get: function () { return onActividadCreated_1.onActividadCreated; } });
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
// export { verificarCotizacionesExpiradas } from './scheduled/verificarCotizacionesExpiradas';
//# sourceMappingURL=index.js.map