import * as crypto from 'crypto';

/**
 * Genera un hash SHA-256 vinculante (blockchain-style).
 * Combina los datos del evento actual con el hash del evento anterior
 * para crear una cadena de integridad verificable.
 */
export function generarHashAudit(datosEvento: Record<string, any>, hashAnterior: string): string {
    const payload = JSON.stringify(datosEvento, Object.keys(datosEvento).sort());
    const combined = payload + '|' + hashAnterior;
    return crypto.createHash('sha256').update(combined).digest('hex');
}

/**
 * Genera el hash genesis (primer evento de la cadena).
 */
export function generarHashGenesis(datosEvento: Record<string, any>): string {
    return generarHashAudit(datosEvento, 'GENESIS');
}

/**
 * Verifica que un hash corresponda a los datos + hash anterior proporcionados.
 */
export function verificarHash(datosEvento: Record<string, any>, hashAnterior: string, hashEsperado: string): boolean {
    const hashCalculado = generarHashAudit(datosEvento, hashAnterior);
    return hashCalculado === hashEsperado;
}
