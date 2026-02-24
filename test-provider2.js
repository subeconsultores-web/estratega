const fs = require('fs');

const file = 'src/app/core/layout/sidebar/sidebar.component.ts';
let content = fs.readFileSync(file, 'utf8');

// remove importProvidersFrom if we added it
content = content.replace(', importProvidersFrom', '');
content = content.replace(/providers:\s*\[[\s\S]*?\],/g, '');

const iconsMatch = content.match(/import\s+{([^}]+)}\s+from\s+['"]lucide-angular['"]/s);
if (iconsMatch) {
    let importsStr = iconsMatch[1];
    if (!importsStr.includes('LUCIDE_ICONS')) {
        content = content.replace(/import\s+{([^}]+)}\s+from\s+['"]lucide-angular['"]/s, `import { LUCIDE_ICONS, LucideIconProvider, $1 } from 'lucide-angular'`);
    }

    const icons = iconsMatch[1]
        .split(',')
        .map(i => i.trim())
        .filter(i => i && !['LucideAngularModule', 'LucideIconProvider', 'LUCIDE_ICONS'].includes(i) && !i.startsWith('type '));

    const providerStr = `\n  providers: [\n    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ ${icons.join(', ')} }) }\n  ],`;

    // insert after imports: [...]
    content = content.replace(/(imports:\s*\[[^\]]+\]),?/g, `$1,${providerStr}`);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed for provider approach:', file);
