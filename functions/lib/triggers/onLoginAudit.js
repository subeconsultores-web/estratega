"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onLoginAudit = void 0;
const admin = require("firebase-admin");
const firestore_1 = require("firebase-functions/v2/firestore");
const db = admin.firestore();
/**
 * Se dispara cuando se crea un nuevo session_log.
 * Compara la metadata con sesiones anteriores del mismo usuario
 * y si detecta un contexto anómalo, crea una alerta en zero_trust_logs.
 */
exports.onLoginAudit = (0, firestore_1.onDocumentCreated)({ document: 'session_logs/{docId}', memory: '256MiB' }, async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const session = snap.data();
    const uid = session.uid;
    if (!uid) {
        console.warn('Session log sin UID, ignorando.');
        return;
    }
    try {
        // Obtener las últimas 5 sesiones del usuario
        const prevSessions = await db.collection('session_logs')
            .where('uid', '==', uid)
            .orderBy('timestamp', 'desc')
            .limit(6) // 1 actual + 5 anteriores
            .get();
        // Si es la primera sesión, no hay con qué comparar
        if (prevSessions.size <= 1) {
            console.log(`Primera sesión registrada para UID: ${uid}`);
            return;
        }
        const sesionesAnteriores = prevSessions.docs
            .filter(d => d.id !== snap.id)
            .map(d => d.data());
        // Detectar anomalías
        const anomalias = [];
        // 1. Comparar zona horaria
        const zonasConocidas = new Set(sesionesAnteriores.map(s => s.zonaHoraria));
        if (session.zonaHoraria && !zonasConocidas.has(session.zonaHoraria)) {
            anomalias.push(`Nueva zona horaria detectada: ${session.zonaHoraria} (conocidas: ${[...zonasConocidas].join(', ')})`);
        }
        // 2. Comparar plataforma
        const plataformasConocidas = new Set(sesionesAnteriores.map(s => s.plataforma));
        if (session.plataforma && !plataformasConocidas.has(session.plataforma)) {
            anomalias.push(`Nueva plataforma: ${session.plataforma}`);
        }
        // 3. Comparar User-Agent (cambio radical, no minor version)
        const uaParts = (session.userAgent || '').split(' ').slice(0, 3).join(' ');
        const uaConocidos = sesionesAnteriores.map(s => (s.userAgent || '').split(' ').slice(0, 3).join(' '));
        const uaMatch = uaConocidos.some(ua => ua === uaParts);
        if (!uaMatch && uaConocidos.length > 0) {
            anomalias.push(`User-Agent desconocido detectado`);
        }
        if (anomalias.length > 0) {
            console.warn(`🚨 [ZERO TRUST] Anomalías detectadas para UID ${uid}:`, anomalias);
            await db.collection('zero_trust_logs').add({
                uid,
                email: session.email || 'unknown',
                reason: 'CONTEXT_ANOMALY',
                anomalias,
                sessionId: snap.id,
                sessionData: {
                    zonaHoraria: session.zonaHoraria,
                    plataforma: session.plataforma,
                    idioma: session.idioma
                },
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                actionTaken: 'ALERT_CREATED',
                resolved: false
            });
        }
    }
    catch (error) {
        console.error('Error en onLoginAudit:', error);
    }
});
//# sourceMappingURL=onLoginAudit.js.map