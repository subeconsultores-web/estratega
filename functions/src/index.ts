import * as admin from 'firebase-admin';
admin.initializeApp();

// Triggers
export { onUserCreated } from './triggers/onUserCreated';
export { onActividadCreated } from './triggers/onActividadCreated';

// Dummy mocks for other functions to satisfy structure
export { onCotizacionCreated } from './triggers/onCotizacionCreated';
export { generarPdf } from './callable/generarPdf';
export { createCheckoutSession } from './callable/createCheckoutSession';
export { stripeWebhook } from './triggers/stripeWebhook';

// export { verificarCotizacionesExpiradas } from './scheduled/verificarCotizacionesExpiradas';
