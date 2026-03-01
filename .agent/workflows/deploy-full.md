---
description: Deploy completo (rules + indexes + hosting + functions) a producción
---

# Deploy Full

// turbo-all

1. Leer el SKILL.md del proyecto para verificar patrones:
```
cat .agent/skills/angular-firebase-patterns/SKILL.md
```

2. Verificar que todas las colecciones en servicios tienen reglas:
```powershell
# Colecciones en código
Select-String -Path "src/app/core/services/*.ts" -Pattern "collection\(this\.firestore,\s*'(\w+)'" | ForEach-Object { $_.Matches.Groups[1].Value } | Sort-Object -Unique
# Colecciones en reglas
Select-String -Path "firestore.rules" -Pattern "match /(\w+)/\{" | ForEach-Object { $_.Matches.Groups[1].Value } | Sort-Object -Unique
```
Compara las listas. Si hay colecciones en código que no están en reglas, **DETENTE y agrega la regla primero.**

3. Build de producción:
```
npx ng build --configuration=production
```
Si falla, corre `/fix-build` antes de continuar.

4. Deploy de reglas e índices:
```
npx firebase deploy --only firestore:rules,firestore:indexes
```

5. Deploy de hosting:
```
npx firebase deploy --only hosting
```

6. Deploy de functions (si hubo cambios):
```
npx firebase deploy --only functions
```

7. Verificar que el sitio carga:
- Abre `https://aulavirtual-dfb37.web.app` en el browser
- Navega a `/finanzas`, `/crm/clientes`, `/catalogo`, `/esg`
- Verifica que no hay spinners infinitos ni errores CORS en la consola
