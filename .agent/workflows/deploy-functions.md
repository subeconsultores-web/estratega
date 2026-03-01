---
description: Deploy solo Cloud Functions a producción
---

# Deploy Functions

// turbo-all

1. Compilar functions:
```
cd functions && npm run build
```

2. Deploy todas las functions:
```
npx firebase deploy --only functions
```

Para desplegar UNA función específica:
```
npx firebase deploy --only functions:nombreFuncion
```

Funciones disponibles: `onUserCreated`, `onActividadCreated`, `leadScoringIA`, `onClienteUpdateLeadScore`, `onRegistroTiempoCreated`, `onCotizacionCreated`, `generarPdf`, `createCheckoutSession`, `stripeWebhook`, `analyzeDocument`, `askSubeIA`, `registerAgency`, `forecastPredictivo`, `generarPropuestaIA`, `generarSugerenciasUpselling`, `getAnalyticsBenchmarking`, `evaluateZeroTrustAnomaly`, `briefingSemanal`, `entrenarModeloScoringMensual`, `api`, `webhookDispatcherClientes`, `fixUserClaims`
