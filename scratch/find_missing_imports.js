import fs from 'fs'
import path from 'path'

function findMissingImports(dir) {
  const files = fs.readdirSync(dir)
  files.forEach(file => {
    const fullPath = path.join(dir, file)
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        findMissingImports(fullPath)
      }
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8')
      if (content.includes('moment.') || content.match(/\bmoment\(/)) {
        if (!content.includes("import moment from 'moment'") && !content.includes("import moment from 'moment-timezone'")) {
           // check if it's commented out
           const lines = content.split('\n');
           const momentUsage = lines.filter(l => (l.includes('moment.') || l.match(/\bmoment\(/)) && !l.trim().startsWith('//') && !l.trim().startsWith('/*'));
           if (momentUsage.length > 0) {
                console.log(`Potential missing import in: ${fullPath}`)
                momentUsage.slice(0, 3).forEach(l => console.log(`  > ${l.trim()}`))
           }
        }
      }
    }
  })
}

findMissingImports('DATN_FE/src')
