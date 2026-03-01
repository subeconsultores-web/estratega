---
description: Smoke test post-deploy - verifica que los módulos principales cargan sin errores
---

# Smoke Test

Después de un deploy, verificar que los módulos críticos cargan correctamente.

1. **Abrir el sitio** en `https://aulavirtual-dfb37.web.app`

2. **Verificar login** — Login con credenciales de prueba

3. **Verificar cada módulo** (navegar y confirmar que no hay spinner infinito):

| Módulo | Ruta | Qué verificar |
|--------|------|---------------|
| Dashboard | `/` | KPIs cargan, forecast muestra datos o error limpio |
| CRM Clientes | `/crm/clientes` | Tabla carga (vacía o con datos) |
| Catálogo | `/catalogo` | Lista carga |
| Cotizaciones | `/cotizaciones` | Lista carga |
| Finanzas | `/finanzas` | Dashboard con KPIs (pueden ser $0) |
| Transacciones | `/finanzas/transacciones` | Lista carga |
| Proyectos | `/proyectos` | Lista carga |
| ESG | `/esg` | Dashboard carga o muestra estado vacío |
| Contratos | `/contratos` | Lista carga |

4. **Verificar consola del browser** — No debe haber:
   - Errores de `permission-denied` de Firestore
   - Errores de `icon has not been provided`
   - Errores de `requires an index`
   - Errores de CORS

5. Si hay errores, correr `/audit` para diagnóstico completo.
