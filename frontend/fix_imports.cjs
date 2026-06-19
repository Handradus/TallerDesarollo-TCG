const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

// 1. Delete duplicate AdBanner.jsx in root
const rootAdBanner = path.join(srcDir, 'AdBanner.jsx');
if (fs.existsSync(rootAdBanner)) {
    fs.unlinkSync(rootAdBanner);
    console.log('Deleted duplicate src/AdBanner.jsx');
}

// 2. Fix imports in all .jsx and .js files directly under src/
const files = fs.readdirSync(srcDir);
let fixedCount = 0;

for (const file of files) {
    if (file.endsWith('.jsx') || file.endsWith('.js')) {
        const filePath = path.join(srcDir, file);
        // Ensure it's a file, not a directory
        if (fs.statSync(filePath).isFile()) {
            let content = fs.readFileSync(filePath, 'utf-8');
            let updatedContent = content
                // Replace import ... from '../
                .replace(/from\s+['"]\.\.\//g, match => match.replace('../', './'))
                // Replace import '../
                .replace(/^import\s+['"]\.\.\//gm, match => match.replace('../', './'));
            
            if (content !== updatedContent) {
                fs.writeFileSync(filePath, updatedContent, 'utf-8');
                console.log(`Fixed imports in ${file}`);
                fixedCount++;
            }
        }
    }
}

console.log(`Total files fixed: ${fixedCount}`);
