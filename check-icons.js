const fs = require('fs');
const path = require('path');
const glob = require('glob');

function toPascalCase(str) {
    return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
}

const htmlFiles = glob.sync('src/app/**/*.html');
let missingIcons = 0;

htmlFiles.forEach(htmlFile => {
    const htmlContent = fs.readFileSync(htmlFile, 'utf8');

    // Regex to match <lucide-icon name="...">
    const iconRegex = /<lucide-icon[^>]*\bname=['"]([^'"]+)['"]/g;
    // Regex to match <lucide-icon [name]="'...'"]
    const iconRegexBound = /<lucide-icon[^>]*\[name\]=['"]'([^'"]+)'['"]/g;

    let match;
    let requiredIcons = new Set();

    while ((match = iconRegex.exec(htmlContent)) !== null) {
        const name = match[1];
        if (!name.includes('{{') && !name.includes(' ')) {
            requiredIcons.add(name);
        }
    }

    while ((match = iconRegexBound.exec(htmlContent)) !== null) {
        const name = match[1];
        if (!name.includes('{{') && !name.includes(' ')) {
            requiredIcons.add(name);
        }
    }

    // Also check [img]="User"
    const imgRegex = /<lucide-icon[^>]*\[img\]=['"]([^'"]+)['"]/g;
    while ((match = imgRegex.exec(htmlContent)) !== null) {
        const name = match[1];
        if (!name.includes('(') && !name.includes('.')) {
            requiredIcons.add(name);
        }
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
                    // Ignore globally exported or common module if they exist, but report to check
                    console.log(`Potential missing import: ${pascalName} in ${actualTsFile} (used in ${htmlFile})`);
                    missingIcons++;
                }
            });
        }
    }
});

console.log('Total potential missing icons:', missingIcons);
