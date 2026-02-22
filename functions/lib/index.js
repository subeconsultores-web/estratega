"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStripeCheckout = exports.generarPdf = exports.onCotizacionCreated = exports.onActividadCreated = exports.onUserCreated = void 0;
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
var createStripeCheckout_1 = require("./callable/createStripeCheckout");
Object.defineProperty(exports, "createStripeCheckout", { enumerable: true, get: function () { return createStripeCheckout_1.createStripeCheckout; } });
// export { verificarCotizacionesExpiradas } from './scheduled/verificarCotizacionesExpiradas';
//# sourceMappingURL=index.js.map