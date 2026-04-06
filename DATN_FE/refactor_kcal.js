const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const patterns = [
    { p: /Math\.round\((totalCalories)\)/g, r: 'roundKcal($1)' },
    { p: /Math\.round\((totalKcal)\)/g, r: 'roundKcal($1)' },
    { p: /Math\.round\((kcal)\)/g, r: 'roundKcal($1)' },
    { p: /Math\.round\((a\.calories)\)/g, r: 'roundKcal($1)' },
    { p: /Math\.round\((activity\.calories)\)/g, r: 'roundKcal($1)' },
    { p: /Math\.round\((deleteActivity\.calories)\)/g, r: 'roundKcal($1)' },
    { p: /Math\.round\((entry\.calories)\)/g, r: 'roundKcal($1)' },
    { p: /Math\.round\((deleteEntry\.calories)\)/g, r: 'roundKcal($1)' },
    { p: /Math\.round\((dayStats\.totalCalories)\)/g, r: 'roundKcal($1)' },
    { p: /Math\.round\((nutrition\?\.calories \|\| 0)\)/g, r: 'roundKcal($1)' },
    { p: /Math\.round\((tick \* maxCalories)\)/g, r: 'roundKcal($1)' },
    { p: /Math\.round\((totals\.calories \/ divisor)\)/g, r: 'roundKcal($1)' },
    { p: /Math\.round\((calories \- 500)\)/g, r: 'roundKcal($1)' },
    { p: /Math\.round\((calories \+ 500)\)/g, r: 'roundKcal($1)' },
    { p: /Math\.round\((Number\(distance\) \* kcalPerKm)\)/g, r: 'roundKcal($1)' },
    { p: /Math\.round\((Number\(form\.goal_value\) \* selectedCat\.kcal_per_unit)\)/g, r: 'roundKcal($1)' },
    { p: /Math\.round\((Number\(form\.goal_value\) \* \(selectedCat\.kcal_per_unit \|\| 0\))\)/g, r: 'roundKcal($1)' },
    { p: /Math\.round\((kcalPerKm \* distanceKm)\)/g, r: 'roundKcal($1)' },
    { p: /Math\.round\((totalCalories \/ caloriesData\.length)\)/g, r: 'roundKcal($1)' },
    { p: /Math\.round\((item\.calories)\)/g, r: 'roundKcal($1)' }
];

let modifiedFiles = [];

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const fullPath = path.join(dir, f);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (f.endsWith('.js') || f.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;
            
            for (const { p, r } of patterns) {
                content = content.replace(p, r);
            }
            
            if (content !== originalContent) {
                if (!content.includes("import { roundKcal } from '~/utils/mathUtils'") && !content.includes("import { roundKcal }")) {
                    const lastImportIndex = content.lastIndexOf('import ');
                    if (lastImportIndex !== -1) {
                        const endOfLastImportLine = content.indexOf('\n', lastImportIndex);
                        content = content.slice(0, endOfLastImportLine + 1) + "import { roundKcal } from '~/utils/mathUtils'\n" + content.slice(endOfLastImportLine + 1);
                    } else {
                        content = "import { roundKcal } from '~/utils/mathUtils'\n" + content;
                    }
                }
                
                fs.writeFileSync(fullPath, content, 'utf8');
                modifiedFiles.push(f);
            }
        }
    }
}

walk(srcDir);
console.log(`Modified ${modifiedFiles.length} files: ${modifiedFiles.join(', ')}`);
