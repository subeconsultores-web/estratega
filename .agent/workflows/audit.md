---
description: Auditoría completa - detecta colecciones sin reglas, queries sin índices, íconos sin importar
---

# Audit

1. **Verificar colecciones vs reglas de Firestore:**

Ejecuta estos comandos y compara las listas:
```powershell
Write-Host "=== Colecciones en CÓDIGO ===" -ForegroundColor Cyan
Select-String -Path "src/app/core/services/*.ts" -Pattern "collection\(this\.firestore,\s*'(\w+)'" | ForEach-Object { $_.Matches.Groups[1].Value } | Sort-Object -Unique

Write-Host "`n=== Colecciones en REGLAS ===" -ForegroundColor Cyan
Select-String -Path "firestore.rules" -Pattern "match /(\w+)/\{" | ForEach-Object { $_.Matches.Groups[1].Value } | Sort-Object -Unique
```

Si hay colecciones en código que **NO** están en reglas → agregarlas inmediatamente o el módulo tendrá carga infinita por permission denied.

2. **Verificar íconos Lucide en todos los componentes:**
```powershell
# Íconos usados en templates
Select-String -Path "src/app/**/*.html" -Pattern 'name="(\w[\w-]*)"' | ForEach-Object { $_.Matches.Groups[1].Value } | Sort-Object -Unique

# Íconos importados en componentes
Select-String -Path "src/app/**/*.ts" -Pattern "LucideIconProvider\(\{([^}]+)\}" | ForEach-Object { $_.Matches.Groups[1].Value }
```

3. **Verificar servicios usan tenantId$ (no user$.tenantId):**
```powershell
# BUSCAR ANTI-PATRÓN: user$.pipe → tenantId
Select-String -Path "src/app/core/services/*.ts" -Pattern "user\$\.pipe|user\.tenantId"
```
Si encuentra resultados → ese servicio tiene un bug. Debe usar `this.authService.tenantId$`.

4. **Verificar componentes OnPush tienen detectChanges:**
```powershell
# Componentes con OnPush
$onPushFiles = Select-String -Path "src/app/**/*.ts" -Pattern "ChangeDetectionStrategy\.OnPush" | ForEach-Object { $_.Path }

foreach ($file in $onPushFiles) {
    $hasDetect = Select-String -Path $file -Pattern "detectChanges"
    if (-not $hasDetect) {
        Write-Host "⚠️  FALTA detectChanges: $file" -ForegroundColor Yellow
    }
}
```

5. **Verificar queries que requieren Índices Compuestos:**
```powershell
# Busca uso de múltiples where() o where() + orderBy() en los servicios
Select-String -Path "src/app/core/services/*.ts" -Pattern "where\([^)]+\)[\s\S]*?(?:where\([^)]+\)|orderBy\([^)]+\))" | ForEach-Object { 
    Write-Host "⚠️  Revisar posible necesidad de índice compuesto en: $($_.Path):$($_.LineNumber)" -ForegroundColor Yellow
}
```
*Si tu query usa más de un campo para filtrar/ordenar, verifica manual que `firestore.indexes.json` tenga el índice compuesto correspondiente antes de hacer deploy.*

6. **Verificar imports incorrectos (RxJS interno o fire/compat):**
```powershell
# Busca imports directos de rxjs/internal que rompen optimizaciones y código legacy de angular/fire
Select-String -Path "src/app/**/*.ts" -Pattern "from 'rxjs/internal'|from '@angular/fire/compat'" | ForEach-Object { 
    Write-Host "❌  Import incorrecto encontrado: $($_.Path):$($_.LineNumber)" -ForegroundColor Red
}
```
*Si encuentras `rxjs/internal`, cámbialo a `rxjs`. Si encuentras `@angular/fire/compat`, migra a la API modular (`@angular/fire/firestore`, etc.).*

7. **Verificar Cloud Functions onCall tienen try/catch:**
```powershell
# Verifica de forma estática básica si una función onCall carece de bloque try
$functionFiles = Get-ChildItem -Path "functions/src/**/*.ts" -Recurse
foreach ($file in $functionFiles) {
    if (Select-String -Path $file.FullName -Pattern "onCall\(") {
        if (-not (Select-String -Path $file.FullName -Pattern "try\s*\{")) {
            Write-Host "❌  Falta try/catch en función onCall: $($file.Name)" -ForegroundColor Red
        }
    }
}
```
*Las funciones `onCall` que fallan silenciosamente sin un block `try/catch` provocando un error en el servidor o timeout, forzarán a Firebase a devolver un misterioso error de CORS en el navegador.*

8. **Generar reporte final categorizado** 
Agrupa y detalla los hallazgos en un documento para acción estructurada:
- 🚨 **Críticos:** (Seguridad / Crashers) Ej: Colecciones sin reglas, `onCall` sin try-catch.
- 🟡 **Advertencias:** (UI / Performance) Ej: `ChangeDetectionStrategy.OnPush` sin `detectChanges`, íconos faltantes.
- 🔵 **Mejores Prácticas:** (Deuda técnica) Ej: Imports internos de RxJs, uso de indexación compuesta apropiada, reemplazo de `user$.tenantId`.
