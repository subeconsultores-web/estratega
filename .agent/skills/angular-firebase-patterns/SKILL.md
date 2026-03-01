---
name: angular-firebase-patterns
description: Patrones y reglas de oro del proyecto sube-gestion (Angular + Firebase). Consultar SIEMPRE antes de modificar servicios, reglas, colecciones o despliegues.
---

# Angular + Firebase Patterns — sube-gestion

## Proyecto y Entorno

| Key | Value |
|---|---|
| Firebase Project ID | `aulavirtual-dfb37` |
| Hosting URL | `https://aulavirtual-dfb37.web.app` |
| Region (Functions) | `us-central1` |
| Build output | `dist/sube-gestion/browser` |
| Functions source | `functions/` |
| Firestore rules file | `firestore.rules` |
| Firestore indexes file | `firestore.indexes.json` |
| Angular config | `angular.json` / `app.config.ts` |

## Colecciones Firestore en uso

Toda colección que se consulta desde el frontend **DEBE** tener reglas en `firestore.rules`.
Si agregas una nueva colección, **agrega la regla inmediatamente**.

### Colecciones tenant-scoped (usan `tenantId` field)
- `clientes`
- `actividades`
- `catalogo`
- `catalogoServicios` (legacy alias — **el código usa `catalogo`**)
- `cotizaciones`
- `contratos`
- `facturas`
- `transacciones`
- `proyectos`
- `tareas`
- `registrosTiempo`
- `movimientosFinancieros`
- `notificaciones`
- `sostenibilidad`

### Colecciones especiales
- `tenants` — config por tenant
- `users` — perfil de usuario
- `apiKeys` — admin only
- `webhooks` — integraciones
- `tickets` — soporte
- `client-logos` — lectura pública

### Subcollections
- `clientes/{clienteId}/archivos/`

## Regla de Oro: tenantId$

**NUNCA uses `user$` para obtener tenantId.** El objeto `User` de Firebase Auth NO tiene la propiedad `tenantId` como custom claim directamente accesible.

```typescript
// ❌ INCORRECTO — user.tenantId no existe en Firebase User
this.authService.user$.pipe(
  map(user => user.tenantId) // SIEMPRE undefined
);

// ✅ CORRECTO — resuelve desde JWT claims → Firestore fallback
this.authService.tenantId$.pipe(
  switchMap(tenantId => { ... })
);
```

## Regla de Oro: Lucide Icons

Cada componente standalone debe registrar los íconos que usa en su `providers`:

```typescript
import { LUCIDE_ICONS, LucideIconProvider, LucideAngularModule, Plus, Search } from 'lucide-angular';

@Component({
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Plus, Search }) }
  ]
})
```

**Si el template usa `name="info"`, el componente DEBE importar `Info`.** Busca todos los `name="..."` en el HTML y verifica que cada ícono esté en el provider.

## Regla de Oro: ChangeDetection

Los componentes de lista que usan `OnPush` **DEBEN** llamar `cdr.detectChanges()` en los callbacks `next` y `error` del subscribe. Sin esto, la UI queda congelada en el estado de loading.

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyListComponent {
  private cdr = inject(ChangeDetectorRef);

  loadData() {
    this.service.getData().subscribe({
      next: (data) => {
        this.items = data;
        this.isLoading = false;
        this.cdr.detectChanges(); // ← OBLIGATORIO con OnPush
      },
      error: (err) => {
        this.isLoading = false;
        this.cdr.detectChanges(); // ← OBLIGATORIO con OnPush
      }
    });
  }
}
```

## Regla de Oro: Índices Compuestos

Si una query Firestore usa `where('tenantId', '==', ...)` + `orderBy(field)`, necesita un **índice compuesto** en `firestore.indexes.json`. Firebase lanza un error con un link para crear el índice, pero es mejor definirlo en el archivo de indexes y desplegarlo.

## Regla de Oro: Error Handling en Dashboards

Cuando un dashboard carga datos de Firestore, **SIEMPRE** maneja el caso de error:
1. Set `isLoading = false` en `finally`
2. Set valores por defecto (ej: `$0` para KPIs) en `catch`
3. Muestra un banner informativo al usuario
4. **NUNCA** dejes el componente en spinner infinito

## Cloud Functions

### Funciones Registradas
- **Triggers:** `onUserCreated`, `onActividadCreated`, `leadScoringIA`, `onClienteUpdateLeadScore`, `onRegistroTiempoCreated`, `onCotizacionCreated`, `webhookDispatcherClientes`
- **Callable:** `generarPdf`, `createCheckoutSession`, `analyzeDocument`, `askSubeIA`, `registerAgency`, `forecastPredictivo`, `generarPropuestaIA`, `generarSugerenciasUpselling`, `getAnalyticsBenchmarking`, `evaluateZeroTrustAnomaly`, `fixUserClaims`, `sugerirRespuestaIA`, `autocompletarEquipo`, `portalClienteChat`, `evaluarCapacidadYPrecios`
- **Scheduled:** `briefingSemanal`, `entrenarModeloScoringMensual`
- **API:** `api`

### CORS en Cloud Functions

Las funciones `onCall` con `cors: true` manejan CORS automáticamente. Pero si la función **crashea internamente** (ej: secret no disponible), Firebase a veces no incluye los headers CORS en la respuesta de error, causando un error CORS en el browser que enmascara el verdadero error (`internal`).

**Siempre revisa los logs de la función antes de asumir que es un problema de CORS.**

## Deploy Checklist

Antes de ejecutar `firebase deploy`:

1. ✅ `ng build --configuration=production` pasa sin errores
2. ✅ Cada colección nueva tiene reglas en `firestore.rules`
3. ✅ Cada query multi-campo tiene índice en `firestore.indexes.json`
4. ✅ Cada ícono usado en templates tiene import en el componente
5. ✅ Componentes con `OnPush` llaman `cdr.detectChanges()`
6. ✅ Dashboards tienen fallback de error (no spinner infinito)
7. ✅ Servicios usan `tenantId$`, nunca `user$.tenantId`
