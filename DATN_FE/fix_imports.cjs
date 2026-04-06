const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const mathUtilsPath = path.join(srcDir, 'utils', 'mathUtils');

let modifiedFiles = [];

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const fullPath = path.join(dir, f);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (f.endsWith('.js') || f.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            
            if (content.includes("import { roundKcal } from '~/utils/mathUtils'")) {
                let relativePath = path.relative(path.dirname(fullPath), mathUtilsPath).replace(/\\/g, '/');
                if (!relativePath.startsWith('.')) {
                    relativePath = './' + relativePath;
                }
                
                content = content.replace("import { roundKcal } from '~/utils/mathUtils'", `import { roundKcal } from '${relativePath}'`);
                fs.writeFileSync(fullPath, content, 'utf8');
                modifiedFiles.push(f);
            }
        }
    }
}

walk(srcDir);
console.log(`Fixed imports in ${modifiedFiles.length} files: ${modifiedFiles.join(', ')}`);
