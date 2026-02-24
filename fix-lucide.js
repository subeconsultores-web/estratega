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

    // Check if it imports LucideAngularModule
    if (!content.includes('lucide-angular')) continue;

    // Extract everything from 'lucide-angular'
    const importRegex = /import\s+{([^}]+)}\s+from\s+['"]lucide-angular['"]/s;
    const match = content.match(importRegex);
    if (!match) continue;

    const importsStr = match[1];
    const importedItems = importsStr
        .split(',')
        .map(i => i.trim())
        .filter(i => i && i !== 'LucideAngularModule' && i !== 'LucideIconProvider' && !i.startsWith('type '));

    if (importedItems.length === 0) continue;

    // Check if it has an imports array with exactly LucideAngularModule
    // We want to replace LucideAngularModule with LucideAngularModule.pick({ ...icons })
    // But be careful not to replace it if it already has .pick(
    if (content.includes('LucideAngularModule.pick')) continue;

    // Replace in imports array or standard usage
    const pickStr = `LucideAngularModule.pick({ ${importedItems.join(', ')} })`;

    // We only want to replace it in the @Component imports array typically.
    // It's safer to just strategically replace `LucideAngularModule` where it's not in an import statement.
    // Let's replace instances of LucideAngularModule that are preceded by space or bracket, and followed by comma or bracket
    const newContent = content.replace(/(imports\s*:\s*\[.*?)(?<!{.*?)LucideAngularModule(?!.*?})([^\]]*\])/gs, (m, p1, p2) => {
        return p1 + pickStr + p2;
    });

    // Also handle standalone imports without other modules in array: imports: [LucideAngularModule]
    // The regex above handles most, but let's just do a safer approach:
    // Find where LucideAngularModule is used in `imports: [...]`

    if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log('Fixed:', path.relative('c:/AppsIA/repogit/Estratega-subeia/sube-gestion', file));
        fixedCount++;
        continue;
    }

    // Fallback if the regex missed it
    if (content.includes('imports: [') && content.includes('LucideAngularModule')) {
        let lines = content.split('\n');
        let modified = false;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('LucideAngularModule') && !lines[i].includes('import {') && !lines[i].includes('importProvidersFrom')) {
                lines[i] = lines[i].replace(/\bLucideAngularModule\b/, pickStr);
                modified = true;
            }
        }
        if (modified) {
            fs.writeFileSync(file, lines.join('\n'), 'utf8');
            console.log('Fixed (Fallback):', path.relative('c:/AppsIA/repogit/Estratega-subeia/sube-gestion', file));
            fixedCount++;
        }
    }
}

console.log(`Done. Fixed ${fixedCount} files.`);
