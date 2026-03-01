const fs = require('fs');
const path = require('path');
const glob = require('glob');

function toPascalCase(str) {
    return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
}

const htmlFiles = glob.sync('src/app/**/*.html');
let missingIcons = 0;
let output = '';

htmlFiles.forEach(htmlFile => {
    const htmlContent = fs.readFileSync(htmlFile, 'utf8');

    let requiredIcons = new Set();

    const iconRegex1 = /<lucide-icon[^>]*\bname=['"]([^'"]+)['"]/g;
    const iconRegex2 = /<lucide-icon[^>]*\[name\]=['"]'([^'"]+)'['"]/g;
    const imgRegex = /<lucide-icon[^>]*\[img\]=['"]([^'"]+)['"]/g;

    let match;
    while ((match = iconRegex1.exec(htmlContent)) !== null) {
        if (!match[1].includes('{{') && !match[1].includes(' ')) requiredIcons.add(match[1]);
    }
    while ((match = iconRegex2.exec(htmlContent)) !== null) {
        if (!match[1].includes('{{') && !match[1].includes(' ')) requiredIcons.add(match[1]);
    }
    while ((match = imgRegex.exec(htmlContent)) !== null) {
        if (!match[1].includes('(') && !match[1].includes('.')) requiredIcons.add(match[1]);
    }

    if (requiredIcons.size > 0) {
        const tsFile = htmlFile.replace('.html', '.ts');
        let tsContent = '';
        let foundTsFile = false;
        let actualTsFile = tsFile;

        if (fs.existsSync(tsFile)) {
            tsContent = fs.readFileSync(tsFile, 'utf8');
            foundTsFile = true;
        } else {
            const dirFiles = fs.readdirSync(path.dirname(htmlFile)).filter(f => f.endsWith('.component.ts'));
            if (dirFiles.length === 1) {
                actualTsFile = path.join(path.dirname(htmlFile), dirFiles[0]);
                tsContent = fs.readFileSync(actualTsFile, 'utf8');
                foundTsFile = true;
            }
        }

        if (foundTsFile) {
            requiredIcons.forEach(iconName => {
                const pascalName = iconName.charAt(0) === iconName.charAt(0).toUpperCase() ? iconName : toPascalCase(iconName);
                const importRegex = new RegExp(`import\\s+{[^}]*\\b${pascalName}\\b[^}]*}\\s+from\\s+['"]lucide-angular['"]`);
                if (!importRegex.test(tsContent)) {
                    output += `Missing: ${pascalName} in ${actualTsFile}\n`;
                    missingIcons++;
                }
            });
        }
    }
});

output += `Total missing: ${missingIcons}\n`;
fs.writeFileSync('missing_icons_clean.txt', output, 'utf8');
console.log('Script completed. Missing icons calculated:', missingIcons);
