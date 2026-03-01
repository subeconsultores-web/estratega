---
description: Auditoría de seguridad de reglas de Firestore
---

# Security Check

1. **Verificar que no existen reglas abiertas:**
```powershell
# Buscar reglas que permitan acceso sin autenticación (excepto client-logos)
Select-String -Path "firestore.rules" -Pattern "allow .+: if true"
```
Solo `client-logos` debería tener `allow read: if true`. Cualquier otra colección abierta es un riesgo de seguridad.

2. **Verificar que todas las operaciones de escritura requieren autenticación:**
```powershell
Select-String -Path "firestore.rules" -Pattern "allow (create|update|delete)"
```
Todas deben incluir `isAuthenticated()` directa o indirectamente (via `canCreateTenantDoc()`, etc.).

3. **Verificar que los custom claims se validan correctamente:**
- `tenantId` → Siempre validado contra `resource.data.tenantId`
- `role` → Solo admin/superadmin pueden eliminar
- `email` → Solo `bruno@subeia.tech` es super admin

4. **Verificar que los datos de tenant no se pueden cruzar:**
- Un usuario de tenant A NO debe poder leer datos de tenant B
- `canReadTenantDoc()` valida `getTenantId() == resource.data.tenantId`

5. **Verificar Cloud Functions:**
```powershell  
# Funciones sin verificación de autenticación
Select-String -Path "functions/src/**/*.ts" -Pattern "onCall" -Include "*.ts"
```
Toda función `onCall` debe verificar `request.auth` al inicio.
