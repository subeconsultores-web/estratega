---
description: Registrar cambios y modificaciones en TECHNICAL_DOCUMENTATION.md después de implementar features o fixes
---

# Documentar Cambios Técnicos

Después de implementar un feature, fix, o cambio arquitectónico significativo, actualizar la documentación técnica.

## Cuándo ejecutar
- Después de agregar un nuevo módulo o componente
- Después de agregar una nueva colección de Firestore
- Después de agregar o modificar Cloud Functions
- Después de cambiar reglas de seguridad
- Después de modificar el modelo de datos
- Después de cambiar patterns de arquitectura (ej: OnPush, tenantId$)
- Después de corregir un bug sistémico que afecta patrones del proyecto

## Archivo destino
`TECHNICAL_DOCUMENTATION.md` — raíz del proyecto sube-gestion

## Estructura del documento (secciones relevantes)

| Sección | Líneas aprox | Qué documentar |
|---------|-------------|----------------|
| **2. Stack Tecnológico** | ~75-102 | Nuevas dependencias, cambio de versiones |
| **4. Modelo de Datos Firestore** | ~148-457 | Nueva colección, nuevo campo, cambio de tipo |
| **5. Especificación de Módulos** | ~460-694 | Nuevo módulo, nuevas vistas, nuevas reglas de negocio |
| **6. Cloud Functions** | ~697-733 | Nueva función, cambio de trigger, nueva scheduled |
| **Apéndice A: Índices Firestore** | final | Nuevos índices compuestos |

## Pasos

1. **Identificar qué cambió** — Revisar los archivos modificados en esta sesión:
   - ¿Se agregó una nueva colección? → Agregar a sección 4 (Modelo de Datos)
   - ¿Se creó un nuevo componente/módulo? → Agregar a sección 5 (Módulos)
   - ¿Se agregó una Cloud Function? → Agregar a sección 6
   - ¿Se agregó una dependencia? → Agregar a sección 2
   - ¿Se modificaron reglas? → Actualizar sección 15 (Security Rules)
   - ¿Se agregó un índice? → Actualizar Apéndice A

2. **Leer la sección relevante** del documento para entender formato y nivel de detalle:
```powershell
# Ver outline del documento
Select-String -Path "TECHNICAL_DOCUMENTATION.md" -Pattern "^#+\s" | Select-Object -First 50
```

3. **Redactar la entrada** siguiendo el formato existente:
   - Para colecciones: tabla con campos, tipos y descripción
   - Para módulos: vistas, componentes y reglas de negocio
   - Para Cloud Functions: tabla con función, trigger/método y acción
   - Para dependencias: tabla con paquete y propósito

4. **Insertar en la posición correcta** del documento, manteniendo el orden numérico y la coherencia.

5. **Actualizar la versión** en la línea 5 si el cambio es significativo:
   - Bug fix menor: incrementar patch (3.0.1)
   - Feature nuevo: incrementar minor (3.1)
   - Cambio arquitectónico: incrementar major (4.0)

6. **También actualizar el SKILL.md** si el cambio afecta patrones del proyecto:
   - Nueva colección → agregar a la lista en SKILL.md
   - Nueva Cloud Function → agregar a la lista en SKILL.md
   - Nuevo patrón → documentar la regla de oro

## Ejemplo de entrada para nueva colección

```markdown
## 4.15 sostenibilidad
Registros de métricas ESG (Ambiental, Social, Gobernanza) del tenant.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | string (auto) | ID único |
| `tenantId` | string | Referencia al tenant |
| `tipo` | string | ambiental \| social \| gobernanza |
| `indicador` | string | Nombre del indicador medido |
| `valor` | number | Valor registrado |
| `unidad` | string | Unidad de medida |
| `fechaFinPeriodo` | timestamp | Fin del período de medición |
| `createdAt` | timestamp | Fecha de creación |
```

## Ejemplo de entrada para nueva Cloud Function

```markdown
| `forecastPredictivo` | Callable (onCall) | Analiza datos comerciales con Gemini AI y genera predicción de ingresos a 90 días |
```
