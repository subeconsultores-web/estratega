---
description: Rollback de un deploy fallido a la versión anterior de hosting
---

# Rollback

Si un deploy causó problemas en producción:

1. **Listar versiones anteriores de hosting:**
```
npx firebase hosting:channel:list
```

2. **Rollback al release anterior:**
```
npx firebase hosting:clone aulavirtual-dfb37:live aulavirtual-dfb37:live --version PREVIOUS
```

O alternativamente, si tienes el código anterior en git:
```
git stash
npx ng build --configuration=production
npx firebase deploy --only hosting
git stash pop
```

3. **Para rollback de Firestore rules:**
Las reglas anteriores se pueden ver en la consola de Firebase → Firestore → Rules → History.

4. **Para rollback de functions:**
```
# Re-deploy desde el último commit bueno
git checkout HEAD~1 -- functions/
cd functions && npm run build && cd ..
npx firebase deploy --only functions
```

5. **Verificar que el rollback funcionó** corriendo `/smoke-test`.
