---
description: Deploy solo hosting (frontend) a producción
---

# Deploy Hosting

// turbo-all

1. Build de producción:
```
npx ng build --configuration=production
```

2. Deploy:
```
npx firebase deploy --only hosting
```

3. Verificar:
```
echo "Desplegado en https://aulavirtual-dfb37.web.app"
```
