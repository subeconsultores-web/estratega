---
description: Revisar logs de Cloud Functions para diagnosticar errores
---

# Check Logs

// turbo-all

1. **Ver logs recientes de todas las funciones:**
```
npx firebase functions:log --limit 50
```

2. **Ver logs de una función específica:**
```
npx firebase functions:log --only forecastPredictivo --limit 20
```

3. **Filtrar solo errores:**
```
npx firebase functions:log --limit 50 2>&1 | Select-String -Pattern "Error|error|FATAL|crash"
```

4. **Errores comunes y soluciones:**

| Error | Causa | Solución |
|-------|-------|----------|
| `CORS policy` | La función crashea internamente | Revisa el log de la función, no es un error de CORS |
| `unauthenticated` | Token expirado o no enviado | Verificar que el frontend envía auth |
| `permission-denied` | Reglas de Firestore | Agregar regla en `firestore.rules` |
| `requires an index` | Índice compuesto faltante | Agregar a `firestore.indexes.json` y desplegar |
| `secret not found` | Secret no configurado | `firebase functions:secrets:set NOMBRE_SECRET` |
