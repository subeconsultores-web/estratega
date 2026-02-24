const fs = require('fs');

const file = 'src/app/core/layout/sidebar/sidebar.component.ts';
let content = fs.readFileSync(file, 'utf8');

// Revert .pick in imports
content = content.replace(/LucideAngularModule\.pick\([^)]+\)/g, 'LucideAngularModule');

// Ensure importProvidersFrom is imported
if (!content.includes('importProvidersFrom')) {
    content = content.replace(/import { Component(.*?) } from '@angular\/core';/g, "import { Component$1, importProvidersFrom } from '@angular/core';");
}

// Add providers: [importProvidersFrom(LucideAngularModule.pick({ ...icons }))]
const iconsMatch = content.match(/import\s+{([^}]+)}\s+from\s+['"]lucide-angular['"]/s);
if (iconsMatch) {
    const icons = iconsMatch[1]
        .split(',')
        .map(i => i.trim())
        .filter(i => i && i !== 'LucideAngularModule' && i !== 'LucideIconProvider' && !i.startsWith('type '));

    const providerStr = `\n  providers: [\n    importProvidersFrom(LucideAngularModule.pick({ ${icons.join(', ')} }))\n  ],`;

    // insert after imports: [...]
    content = content.replace(/(imports:\s*\[[^\]]+\]),?/g, `$1,${providerStr}`);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed:', file);
