import * as admin from 'firebase-admin';
admin.initializeApp();

// Triggers
export { onUserCreated } from './triggers/onUserCreated';
export { onActividadCreated } from './triggers/onActividadCreated';
export { leadScoringIA } from './triggers/agentes/leadScoringIA';

// Dummy mocks for other functions to satisfy structure
export { onCotizacionCreated } from './triggers/onCotizacionCreated';
export { generarPdf } from './callable/generarPdf';
export { createCheckoutSession } from './callable/createCheckoutSession';
export { stripeWebhook } from './triggers/stripeWebhook';
export { analyzeDocument } from './callable/analyzeDocument';
export { askSubeIA } from './callable/askSubeIA';
export { registerAgency } from './callable/registerAgency';
export { forecastPredictivo } from './callable/agentes/forecastPredictivo';
export { generarPropuestaIA } from './callable/agentes/generarPropuestaIA';

export { briefingSemanal } from './scheduled/agentes/briefingSemanal';

// export { verificarCotizacionesExpiradas } from './scheduled/verificarCotizacionesExpiradas';
