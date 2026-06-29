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
            if (content.includes('nav__dropdown-content')) {
                const parts = content.split('<div class="nav__dropdown-content">');
                if (parts.length > 1) {
                    const dropdownContent = parts[1].substring(0, 500); // Check only the start of dropdown
                    if (!dropdownContent.includes('compress-video')) {
                        content = parts[0] + '<div class="nav__dropdown-content">\n' + newNavLinks + parts[1];
                        fs.writeFileSync(fullPath, content, 'utf8');
                        console.log(`Updated nav in ${fullPath}`);
                    }
                }
            }
        }
    }
}

processDir(rootDir);
console.log('Nav update 2 complete!');
