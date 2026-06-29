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
            const badArtifactRegex = /<text y='\.9em'[^>]*>.*?<\/text><\/svg>"\s*\/>/g;
            if (badArtifactRegex.test(content)) {
                content = content.replace(badArtifactRegex, '');
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Cleaned up HTML artifact in ${fullPath}`);
            }
        }
    }
}

processDir(rootDir);
console.log('Cleanup Done!');
