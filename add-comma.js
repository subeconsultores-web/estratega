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
    if (!content.includes('LUCIDE_ICONS')) continue;

    // Look for providers array right before templateUrl, styles, template, etc. where a comma is missing
    const originalContent = content;

    // Fix: ]\n  templateUrl:
    content = content.replace(/\](\s*(?:templateUrl|template|styleUrls|styles|providers|imports|selector|standalone|schemas|encapsulation|changeDetection|animations)\s*:)/g, '],$1');

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed missing comma:', file);
        fixedCount++
    }
}
console.log('Fixed', fixedCount, 'files with missing commas.');
