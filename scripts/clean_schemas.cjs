const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (!file.startsWith('.') && file !== 'node_modules' && file !== 'dist' && file !== 'scripts' && file !== 'public') {
                processDir(fullPath);
            }
        } else if (file.endsWith('.html')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            const schemaRegex = /<script type="application\/ld\+json">[\s\S]*?<\/script>/g;
            const matches = content.match(schemaRegex);
            
            if (matches && matches.length > 1) {
                console.log(`Found ${matches.length} schemas in ${fullPath}, cleaning...`);
                // Determine what schemas to keep. Usually 1 WebApplication and 1 FAQPage.
                // For simplicity, we just keep the FIRST WebApplication and FIRST FAQPage we find.
                let keptWebApp = false;
                let keptFAQ = false;
                
                content = content.replace(schemaRegex, (match) => {
                    if (match.includes('"@type": "WebApplication"') || match.includes('"@type":"WebApplication"')) {
                        if (!keptWebApp) {
                            keptWebApp = true;
                            return match; // keep
                        }
                        return ''; // remove duplicate
                    }
                    if (match.includes('"@type": "FAQPage"') || match.includes('"@type":"FAQPage"')) {
                        if (!keptFAQ) {
                            keptFAQ = true;
                            return match; // keep
                        }
                        return ''; // remove duplicate
                    }
                    return match; // keep others
                });
                
                // Clean up any empty blank lines left behind
                content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
                
                fs.writeFileSync(fullPath, content, 'utf8');
            }
        }
    }
}

processDir(rootDir);
console.log('Schema cleanup complete!');
