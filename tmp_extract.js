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

const icons = new Set();

walkDir(srcDir, (filePath) => {
    if (filePath.endsWith('.html') || filePath.endsWith('.ts')) {
        const content = fs.readFileSync(filePath, 'utf8');

        let match;
        const htmlRegex = /name=[\"']([^\"']+)[\"']/g;
        while ((match = htmlRegex.exec(content)) !== null) {
            if (!match[1].includes(' ') && !match[1].includes('?')) icons.add(match[1]);
        }

        const dynamicHtmlRegex = /\[name\]=[\"']['\"]([^'\"]+)['\"][\"']/g;
        while ((match = dynamicHtmlRegex.exec(content)) !== null) icons.add(match[1]);

        const ternaryRegex = /\[name\]=[\"'][^?]+\?\s*['\"]([^'\"]+)['\"]\s*:\s*['\"]([^'\"]+)['\"][\"']/g;
        while ((match = ternaryRegex.exec(content)) !== null) {
            icons.add(match[1]);
            icons.add(match[2]);
        }

        const propRegex = /icon:\s*['\"]([^'\"]+)['\"]/g;
        while ((match = propRegex.exec(content)) !== null) icons.add(match[1]);
    }
});

function toPascalCase(str) {
    return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
}

const iconImports = Array.from(icons)
    .filter(i => /^[a-z]+(-[a-z0-9]+)*$/.test(i))
    .map(i => toPascalCase(i))
    .sort();

fs.writeFileSync('extracted_icons_utf8.txt', Array.from(new Set(iconImports)).join(', '), 'utf8');
