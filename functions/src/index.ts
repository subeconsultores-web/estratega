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
export { generarNextBestAction } from './callable/generarNextBestAction';
export { registerAgency } from './callable/registerAgency';
export { forecastPredictivo } from './callable/agentes/forecastPredictivo';
export { generarPropuestaIA } from './callable/agentes/generarPropuestaIA';
export { generarSugerenciasUpselling } from './callable/agentes/generarSugerenciasUpselling';
export { getAnalyticsBenchmarking } from './callable/getAnalyticsBenchmarking';
export { evaluateZeroTrustAnomaly } from './callable/evaluateZeroTrustAnomaly';
export { evaluarCapacidadYPrecios } from './callable/evaluarCapacidadYPrecios';
export { getPublicCotizacion } from './callable/getPublicCotizacion';
export { acceptPublicCotizacion } from './callable/acceptPublicCotizacion';
export { autocompletarEquipo } from './callable/autocompletarEquipo';
export { sugerirRespuestaIA } from './callable/sugerirRespuestaIA';
export { portalClienteChat } from './callable/portalClienteChat';
export { createClientUser } from './callable/createClientUser';
export { createTeamMember } from './callable/createTeamMember';
export { updateTeamMember } from './callable/updateTeamMember';
export { verificarIntegridadLedger } from './callable/verificarIntegridadLedger';
export { busquedaSemantica } from './callable/busquedaSemantica';
export { calcularHuellaDigitalAuto } from './callable/sostenibilidad/calcularHuellaDigitalAuto';

export { onLoginAudit } from './triggers/onLoginAudit';
export { onFacturaAudit } from './triggers/onFacturaAudit';
export { onContratoAudit } from './triggers/onContratoAudit';

export { briefingSemanal } from './scheduled/agentes/briefingSemanal';
export { entrenarModeloScoringMensual } from './scheduled/agentes/entrenarModeloScoringMensual';
export { calcularPromedioPago } from './scheduled/finanzas/calcularPromedioPago';

// export { analizarDocumentoIA } from './triggers/agentes/analizarDocumentoIA';

// API Abierta (Ecosistema Sube)
export { api } from './api/index';
export { webhookDispatcherClientes } from './triggers/webhooks/webhookDispatcher';

// export { verificarCotizacionesExpiradas } from './scheduled/verificarCotizacionesExpiradas';

// fixUserClaims removed from production export on 2026-02-27 (audit remediation)
// Source file kept at ./callable/fixUserClaims.ts for future one-off use if needed
