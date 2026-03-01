import * as functions from 'firebase-functions';

/**
 * DISABLED SECURITY VULNERABILITY
 * This function was temporarily used to fix user claims.
 * Has been entirely wiped and disabled to prevent unauthorized role escalation.
 */
export const fixUserClaims = functions.https.onRequest((req, res) => {
    res.status(403).json({ error: 'Endpoint permanently disabled.' });
});
