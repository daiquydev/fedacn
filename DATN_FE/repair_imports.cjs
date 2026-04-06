const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
let modifiedFiles = [];

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const fullPath = path.join(dir, f);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (f.endsWith('.js') || f.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            
            // Find if roundKcal import exists
            const lines = content.split(/\r?\n/);
            let importLineToKeep = '';
            let newLines = [];
            let changed = false;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (line.includes('import { roundKcal } from')) {
                    // Extract the clean import line
                    const match = line.match(/import\s+\{\s*roundKcal\s*\}\s+from\s+['"][^'"]+['"]/);
                    if (match) {
                        importLineToKeep = match[0];
                    }
                    
                    // If it's mangled like `import { import { roundKcal } from ...`
                    if (line.trim().startsWith('import {') && line.includes('import { roundKcal }')) {
                        // Just remove the injected part
                        const cleaned = line.replace(/import\s+\{\s*roundKcal\s*\}\s+from\s+['"][^'"]+['"]/, '');
                        if (cleaned.trim() !== '') {
                            newLines.push(cleaned);
                        }
                    } 
                    // Normal full line
                    else if (line.trim().startsWith('import { roundKcal }')) {
                        // Skip it, we will put it at the very top later
                    }
                    else {
                        // Something else, just replace the match and keep the rest
                        const cleaned = line.replace(/import\s+\{\s*roundKcal\s*\}\s+from\s+['"][^'"]+['"]/, '');
                        newLines.push(cleaned);
                    }
                    changed = true;
                } else {
                    newLines.push(line);
                }
            }
            
            if (changed && importLineToKeep) {
                // Add exactly one at the top
                newLines.unshift(importLineToKeep);
                fs.writeFileSync(fullPath, newLines.join('\n'), 'utf8');
                modifiedFiles.push(f);
            }
        }
    }
}

walk(srcDir);
console.log(`Repaired ${modifiedFiles.length} files: ${modifiedFiles.join(', ')}`);
