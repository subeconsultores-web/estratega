const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src/app');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

function toPascalCase(str) {
    return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
}

function processComponent(tsPath, htmlPath) {
    if (!fs.existsSync(tsPath)) return;

    let contentTs = fs.readFileSync(tsPath, 'utf8');
    let contentHtml = htmlPath && fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf8') : '';

    const combinedContent = contentTs + contentHtml;
    const icons = new Set();

    // Extract icons from this component only
    let match;
    const htmlRegex = /name=[\"']([^\"']+)[\"']/g;
    while ((match = htmlRegex.exec(combinedContent)) !== null) {
        if (!match[1].includes(' ') && !match[1].includes('?')) icons.add(match[1]);
    }
    const dynamicHtmlRegex = /\[name\]=[\"']['\"]([^'\"]+)['\"][\"']/g;
    while ((match = dynamicHtmlRegex.exec(combinedContent)) !== null) icons.add(match[1]);

    const ternaryRegex = /\[name\]=[\"'][^?]+\?\s*['\"]([^'\"]+)['\"]\s*:\s*['\"]([^'\"]+)['\"][\"']/g;
    while ((match = ternaryRegex.exec(combinedContent)) !== null) {
        icons.add(match[1]);
        icons.add(match[2]);
    }

    const propRegex = /icon:\s*['\"]([^'\"]+)['\"]/g;
    while ((match = propRegex.exec(combinedContent)) !== null) icons.add(match[1]);

    const iconImports = Array.from(icons)
        .filter(i => /^[a-z]+(-[a-z0-9]+)*$/.test(i))
        .map(i => toPascalCase(i))
        .sort();

    if (iconImports.length > 0 && contentTs.includes('LucideAngularModule')) {
        // Find existing import
        if (contentTs.includes('import { LucideAngularModule } from \'lucide-angular\';')) {
            contentTs = contentTs.replace(
                'import { LucideAngularModule } from \'lucide-angular\';',
                `import { LucideAngularModule, ${iconImports.join(', ')} } from 'lucide-angular';`
            );
        } else if (contentTs.match(/import\s+{\s*LucideAngularModule\s*}\s+from\s+['"]lucide-angular['"];/)) {
            contentTs = contentTs.replace(
                /import\s+{\s*LucideAngularModule\s*}\s+from\s+['"]lucide-angular['"];/,
                `import { LucideAngularModule, ${iconImports.join(', ')} } from 'lucide-angular';`
            );
        }

        // Update imports array: change LucideAngularModule to LucideAngularModule.pick({ ... })
        // Use a regex to find LucideAngularModule inside imports array and replace it
        // Note: some might already have .pick or we just replace the exact word 'LucideAngularModule' if it stands alone in the imports array

        // This regex ensures we only replace it inside the imports array or similar, where it is not followed by .pick
        contentTs = contentTs.replace(/imports:\s*\[([^\]]*)LucideAngularModule([^A-Za-z0-9_.])/g, (fullMatch, p1, p2) => {
            // check if it already has .pick
            if (fullMatch.includes('LucideAngularModule.pick')) return fullMatch;
            return `imports: [${p1}LucideAngularModule.pick({ ${iconImports.join(', ')} })${p2}`;
        });

        fs.writeFileSync(tsPath, contentTs, 'utf8');
        console.log('Updated ' + tsPath);
    }
}

walkDir(srcDir, (filePath) => {
    if (filePath.endsWith('.ts') && !filePath.endsWith('.spec.ts')) {
        const htmlPath = filePath.replace('.ts', '.html');
        // also check .component.ts -> .component.html is handled
        processComponent(filePath, fs.existsSync(htmlPath) ? htmlPath : null);
    }
});
