const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const faviconTag = '<link rel="icon" type="image/png" href="/clipy-logo.png" />';

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
            // Try to replace existing <link rel="icon" ...> tag
            const iconRegex = /<link\s+rel=["']icon["'][^>]*>/i;
            if (iconRegex.test(content)) {
                content = content.replace(iconRegex, faviconTag);
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated favicon in ${fullPath}`);
            } else {
                // If not found, add it before </head>
                content = content.replace('</head>', `  ${faviconTag}\n</head>`);
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Added favicon to ${fullPath}`);
            }
        }
    }
}

processDir(rootDir);
console.log('Done!');
