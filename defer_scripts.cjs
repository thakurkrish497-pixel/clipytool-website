const fs = require('fs');
const path = require('path');

const rootDir = __dirname;

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (!file.startsWith('.') && file !== 'node_modules' && file !== 'dist') {
                processDir(fullPath);
            }
        } else if (file.endsWith('.html')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Regex to find <script src="..."> that don't have async, defer, or type="module"
            const scriptRegex = /<script\s+(?![^>]*\b(async|defer|type=["']module["']))([^>]*)src=["']([^"']+)["']([^>]*)>/gi;
            
            if (scriptRegex.test(content)) {
                content = content.replace(scriptRegex, (match, ignore, before, src, after) => {
                    console.log(`Deferring script ${src} in ${file}`);
                    return `<script ${before}src="${src}"${after} defer>`;
                });
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated scripts in ${fullPath}`);
            }
        }
    }
}

processDir(rootDir);
console.log('Done!');
