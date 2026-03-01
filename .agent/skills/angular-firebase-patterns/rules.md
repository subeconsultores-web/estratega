# Firestore Rules Audit Reference

## Current Production Rules Location
`firestore.rules` (root of sube-gestion)

## Collections That MUST Have Rules

Every collection queried by frontend services must have an explicit match in `firestore.rules`.
The canonical list of collections used in code:

| Collection | Service File | Rule Pattern |
|---|---|---|
| `clientes` | `crm.service.ts` | `canReadTenantDoc()` |
| `actividades` | `crm.service.ts` | `canReadTenantDoc()` |
| `catalogo` | `catalogo.service.ts` | `canReadTenantDoc()` |
| `catalogoServicios` | legacy (keep in rules) | `canReadTenantDoc()` |
| `cotizaciones` | `cotizacion.service.ts` | `canReadTenantDoc()` |
| `contratos` | `contrato.service.ts` | `canReadTenantDoc()` |
| `facturas` | `finanzas.service.ts`, `factura.service.ts` | `canReadTenantDoc()` |
| `transacciones` | `finanzas.service.ts` | `canReadTenantDoc()` |
| `proyectos` | `proyectos.service.ts` | `canReadTenantDoc()` |
| `tareas` | `tareas.service.ts` | `canReadTenantDoc()` |
| `registrosTiempo` | `tareas.service.ts` | `canReadTenantDoc()` |
| `movimientosFinancieros` | `finanzas.service.ts` | `canReadTenantDoc()` |
| `notificaciones` | notification service | `canReadTenantDoc()` |
| `sostenibilidad` | `esg.service.ts` | `canReadTenantDoc()` |
| `tenants` | `auth.service.ts` | custom (tenant+admin) |
| `users` | `user.service.ts` | custom (uid+tenant) |
| `apiKeys` | `api-key.service.ts` | admin only |
| `tickets` | `tickets.service.ts` | needs rules |
| `webhooks` | `webhook.service.ts` | needs rules |
| `client-logos` | public | `allow read: if true` |

## How to Add a New Collection

1. Add the service that queries it
2. **Immediately** add to `firestore.rules`:
```
match /newCollection/{docId} {
  allow read: if canReadTenantDoc();
  allow create: if canCreateTenantDoc();
  allow update: if canUpdateTenantDoc();
  allow delete: if canDeleteTenantDoc();
}
```
3. If the query uses `where()` + `orderBy()`, add composite index to `firestore.indexes.json`
4. Deploy: `firebase deploy --only firestore:rules,firestore:indexes`

## Validation Script (Manual)

To check for mismatches, grep all collection names in services vs rules:

```powershell
# Collections used in code
Select-String -Path "src/app/core/services/*.ts" -Pattern "collection\(this\.firestore,\s*'(\w+)'" | ForEach-Object { $_.Matches.Groups[1].Value } | Sort-Object -Unique

# Collections in rules
Select-String -Path "firestore.rules" -Pattern "match /(\w+)/\{" | ForEach-Object { $_.Matches.Groups[1].Value } | Sort-Object -Unique
```

Any collection in code but NOT in rules = **permission denied** bug.
