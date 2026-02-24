import * as admin from 'firebase-admin';
admin.initializeApp();

// Triggers
export { onUserCreated } from './triggers/onUserCreated';
export { onActividadCreated } from './triggers/onActividadCreated';
export { leadScoringIA } from './triggers/agentes/leadScoringIA';
export { onClienteUpdateLeadScore } from './triggers/agentes/onClienteUpdateLeadScore';
export { onRegistroTiempoCreated } from './triggers/agentes/onRegistroTiempoCreated';

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
export { generarSugerenciasUpselling } from './callable/agentes/generarSugerenciasUpselling';
export { getAnalyticsBenchmarking } from './callable/getAnalyticsBenchmarking';
export { evaluateZeroTrustAnomaly } from './callable/evaluateZeroTrustAnomaly';

export { briefingSemanal } from './scheduled/agentes/briefingSemanal';
export { entrenarModeloScoringMensual } from './scheduled/agentes/entrenarModeloScoringMensual';

// export { analizarDocumentoIA } from './triggers/agentes/analizarDocumentoIA';

// API Abierta (Ecosistema Sube)
export { api } from './api/index';
export { webhookDispatcherClientes } from './triggers/webhooks/webhookDispatcher';

// export { verificarCotizacionesExpiradas } from './scheduled/verificarCotizacionesExpiradas';

// TEMPORARY: Admin function to fix user claims (remove after use)
export { fixUserClaims } from './callable/fixUserClaims';
