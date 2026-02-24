import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';

// Almacén en memoria de los timestamps de las peticiones recientes
const requestTimestamps: number[] = [];

// Configuración de tolerancia al comportamiento anómalo (Rate Limiting en Frontend)
const MAX_REQUESTS_PER_WINDOW = 30; // Máximo 30 peticiones HTTP...
const TIME_WINDOW_MS = 5000; // ...en un umbral de 5 segundos

/**
 * Escudo Zero Trust Frontend
 * Monitorea el volumen de tráfico saliente para detectar extracción robotizada de datos o ataques.
 */
export const zeroTrustInterceptor: HttpInterceptorFn = (req, next) => {
    const functions = inject(Functions);
    const now = Date.now();

    // Registrar tiempo de la petición actual
    requestTimestamps.push(now);

    // Limpiar peticiones que ya expiraron su ventana de tiempo
    while (requestTimestamps.length > 0 && requestTimestamps[0] < now - TIME_WINDOW_MS) {
        requestTimestamps.shift();
    }

    // Avalancha de peticiones detectada
    if (requestTimestamps.length > MAX_REQUESTS_PER_WINDOW) {
        console.warn('⚠️ [Zero Trust Firewall] Tráfico anómalo detectado. Exceso de peticiones detectado.');

        // Disparar Cloud Function Firewall Evaluator para que el Backend audite y posiblemente revoque la sesión
        const reportAnomaly = httpsCallable(functions, 'evaluateZeroTrustAnomaly');

        reportAnomaly({ reason: 'RATE_LIMIT_EXCEEDED', count: requestTimestamps.length })
            .then(() => {
                console.error('⛔ Sesión revocada por el servidor como medida de seguridad activa.');
            })
            .catch(e => console.error('Error reportando anomalía Zero Trust:', e));

        // Resetear contadores para no saturar al backend enviando la alerta multiples veces
        requestTimestamps.length = 0;

        // Se deja fluir la petición HTTP (Next) sabiendo que si los tokens fueron revocados en BD, 
        // fallará silenciosamente con 401/403 de Firebase.
    }

    return next(req);
};
