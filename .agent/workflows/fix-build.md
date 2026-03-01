---
description: Corregir errores de build de Angular
---

# Fix Build

// turbo-all

1. Intentar build:
```
npx ng build --configuration=production 2>&1
```

2. Si falla, analizar los errores:
   - **Imports faltantes** → Agregar el import
   - **Propiedades no existentes** → Verificar el modelo/interface
   - **Pipes no encontrados** → Verificar imports del componente standalone
   - **Lucide icons** → Verificar que el ícono está en el `LucideIconProvider`

3. Consultar SKILL.md para patrones correctos:
   - `tenantId$` en vez de `user$.tenantId`
   - `ChangeDetectorRef` con `OnPush`
   - Lucide icons en providers

4. Re-intentar build hasta que pase.
