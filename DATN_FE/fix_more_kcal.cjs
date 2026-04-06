const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const filesToFix = [
    'src/pages/Training/Training.jsx',
    'src/pages/Me/components/MeOverview/MeOverview.jsx',
    'src/components/SportEvent/VideoCallModal.jsx',
    'src/components/SportEvent/ActivityShareModal.jsx',
    'src/components/Post/ActivityPreviewCard.jsx',
    'src/components/ModernIngredientList/ModernIngredientList.jsx'
];

for(const relPath of filesToFix) {
    const fullPath = path.join(__dirname, relPath.replace(/\//g, path.sep));
    if(!fs.existsSync(fullPath)) continue;
    
    let content = fs.readFileSync(fullPath, 'utf8');
    let originalContent = content;

    content = content.replace(/Math\.round\(bmr\)/g, 'roundKcal(bmr)');
    content = content.replace(/Math\.round\(tdee\)/g, 'roundKcal(tdee)');
    content = content.replace(/Math\.round\(kcalPerMinute \* \(activeSecs \/ 60\)\)/g, 'roundKcal(kcalPerMinute * (activeSecs / 60))');
    content = content.replace(/Math\.round\(activity\.calories \|\| 0\)/g, 'roundKcal(activity.calories || 0)');
    content = content.replace(/Math\.round\(ingredient\.nutrition\.calories \* currentServings \/ servings\)/g, 'roundKcal(ingredient.nutrition.calories * currentServings / servings)');

    if(content !== originalContent) {
        if(!content.includes('import { roundKcal }')) {
            const mathUtilsPath = path.join(srcDir, 'utils', 'mathUtils');
            let relativePath = path.relative(path.dirname(fullPath), mathUtilsPath).replace(/\\/g, '/');
            if (!relativePath.startsWith('.')) {
                relativePath = './' + relativePath;
            }
            content = `import { roundKcal } from '${relativePath}'\n` + content;
        }
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Fixed ${relPath}`);
    }
}
