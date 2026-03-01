"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixUserClaims = void 0;
const functions = require("firebase-functions");
/**
 * DISABLED SECURITY VULNERABILITY
 * This function was temporarily used to fix user claims.
 * Has been entirely wiped and disabled to prevent unauthorized role escalation.
 */
exports.fixUserClaims = functions.https.onRequest((req, res) => {
    res.status(403).json({ error: 'Endpoint permanently disabled.' });
});
//# sourceMappingURL=fixUserClaims.js.map