const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

const newNavLinks = `          <a href="/compress-video/index.html">Compress Video</a>
          <a href="/loop-video/index.html">Loop Video</a>`;

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
            if (content.includes('nav__dropdown-content') && !content.includes('/compress-video/index.html')) {
                // insert new tools inside the dropdown-content div
                content = content.replace(
                    /nav__dropdown-content">/,
                    `nav__dropdown-content">\n${newNavLinks}`
                );
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated nav in ${fullPath}`);
            }
        }
    }
}

processDir(rootDir);
console.log('Nav update complete!');
