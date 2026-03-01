---
description: Code review checklist antes de mergear o desplegar cambios
---

# Code Review

Checklist para revisar antes de mergear o desplegar cualquier cambio:

## Firestore
- [ ] ¿Se agregó una nueva colección? → Agregar regla en `firestore.rules`
- [ ] ¿Se agregó un query con `where()` + `orderBy()`? → Agregar índice en `firestore.indexes.json`
- [ ] ¿El servicio usa `tenantId$`? (NO `user$.tenantId`)

## Componentes Angular
- [ ] ¿El componente usa `OnPush`? → Verificar `cdr.detectChanges()` en subscribe next/error
- [ ] ¿El template usa `lucide-icon name="X"`? → Verificar que `X` está en el `LucideIconProvider` del componente
- [ ] ¿El componente carga datos async? → Verificar manejo de error (no spinner infinito)
- [ ] ¿Se usan `*ngIf="isLoading"` y `*ngIf="!isLoading"`? → El error handler debe setear `isLoading = false`

## Cloud Functions
- [ ] ¿La función usa `onCall`? → Agregar `cors: true` en opciones
- [ ] ¿La función usa secrets? → Verificar que el secret existe: `firebase functions:secrets:access NOMBRE`
- [ ] ¿La función responde JSON de IA? → Limpiar markdown fences (`\`\`\`json` etc.)

## Deploy
- [ ] ¿Build pasa? → `npx ng build --configuration=production`
- [ ] ¿Se despliegan reglas junto con el código? → `firebase deploy --only firestore:rules,hosting`
- [ ] ¿El proyecto destino es correcto? → Verificar `.firebaserc` → `aulavirtual-dfb37`
