const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            walk(filePath, fileList);
        } else if (filePath.endsWith('.ts')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

const files = walk('c:/AppsIA/repogit/Estratega-subeia/sube-gestion/src');
let fixedCount = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('lucide-angular')) continue;
    if (!content.includes('@Component')) continue;

    let originalContent = content;

    // Check what is imported from lucide-angular
    const importRegex = /import\s+{([^}]+)}\s+from\s+['"]lucide-angular['"]/s;
    const match = content.match(importRegex);
    if (!match) continue;

    // Fix imports
    let importsStr = match[1];
    let needsProviderImport = false;
    if (!importsStr.includes('LUCIDE_ICONS')) {
        content = content.replace(importRegex, `import { LUCIDE_ICONS, LucideIconProvider, $1 } from 'lucide-angular'`);
    }

    const importedItems = importsStr
        .split(',')
        .map(i => i.trim())
        .filter(i => i && !['LucideAngularModule', 'LucideIconProvider', 'LUCIDE_ICONS'].includes(i) && !i.startsWith('type '));

    if (importedItems.length === 0) continue;

    // Clean up our previous failed attempts (like LucideAngularModule.pick() and importProvidersFrom)
    content = content.replace(/LucideAngularModule\.pick\([^)]+\)/g, 'LucideAngularModule');
    content = content.replace(/importProvidersFrom\(\s*LucideAngularModule\s*\)/g, 'LucideAngularModule');

    // Remove old providers block if we just added it to sidebar (or if it exists from previous attempts, but let's be careful, only remove if it contains LucideIconProvider)
    // Actually, it's safer to just inject it if LucideIconProvider is NOT in the providers array already.

    if (!content.includes('new LucideIconProvider')) {
        const providerStr = `{ provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ ${importedItems.join(', ')} }) }`;

        // Find if providers array exists
        if (content.includes('providers: [')) {
            content = content.replace(/(providers:\s*\[)/, `$1\n    ${providerStr},`);
        } else {
            // Re-check where to insert providers: after imports: [...] 
            content = content.replace(/(imports:\s*\[[^\]]+\]),?/g, `$1,\n  providers: [\n    ${providerStr}\n  ]`);
        }
    }

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed:', path.relative('c:/AppsIA/repogit/Estratega-subeia/sube-gestion', file));
        fixedCount++;
    }
}

console.log(`Done. Fixed ${fixedCount} files.`);
