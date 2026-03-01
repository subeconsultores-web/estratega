"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generarHashAudit = generarHashAudit;
exports.generarHashGenesis = generarHashGenesis;
exports.verificarHash = verificarHash;
const crypto = require("crypto");
/**
 * Genera un hash SHA-256 vinculante (blockchain-style).
 * Combina los datos del evento actual con el hash del evento anterior
 * para crear una cadena de integridad verificable.
 */
function generarHashAudit(datosEvento, hashAnterior) {
    const payload = JSON.stringify(datosEvento, Object.keys(datosEvento).sort());
    const combined = payload + '|' + hashAnterior;
    return crypto.createHash('sha256').update(combined).digest('hex');
}
/**
 * Genera el hash genesis (primer evento de la cadena).
 */
function generarHashGenesis(datosEvento) {
    return generarHashAudit(datosEvento, 'GENESIS');
}
/**
 * Verifica que un hash corresponda a los datos + hash anterior proporcionados.
 */
function verificarHash(datosEvento, hashAnterior, hashEsperado) {
    const hashCalculado = generarHashAudit(datosEvento, hashAnterior);
    return hashCalculado === hashEsperado;
}
//# sourceMappingURL=auditHash.js.map