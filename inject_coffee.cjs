const fs = require('fs');
const path = require('path');

const root = __dirname;
const htmlFiles = [];

htmlFiles.push(path.join(root, 'index.html'));

const dirs = fs.readdirSync(root, { withFileTypes: true });
for (const dir of dirs) {
  if (dir.isDirectory() && dir.name !== 'node_modules' && dir.name !== 'dist' && dir.name !== 'src' && dir.name !== 'public') {
    const indexPath = path.join(root, dir.name, 'index.html');
    if (fs.existsSync(indexPath)) {
      htmlFiles.push(indexPath);
    }
  }
}

const coffeeLink = `<a href="https://buymeacoffee.com/YOUR_USERNAME" target="_blank" class="nav__link nav__link--coffee" aria-label="Buy me a coffee">☕ Buy me a coffee</a>`;

for (const file of htmlFiles) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('nav__link--coffee')) continue;

  if (file.endsWith('index.html') && file === path.join(root, 'index.html')) {
    // Homepage: inject before Hero
    const homeNav = `
  <div style="position:absolute; top:24px; right:24px; z-index:100;">
    ${coffeeLink}
  </div>`;
    content = content.replace('<div class="mesh-bg" aria-hidden="true">', homeNav + '\n  <div class="mesh-bg" aria-hidden="true">');
  } else {
    // Tools: inject into .nav__links
    content = content.replace('</div>\n  </nav>', `  ${coffeeLink}\n    </div>\n  </nav>`);
  }

  fs.writeFileSync(file, content);
  console.log('Injected coffee link into:', file);
}

// Now add the CSS for .nav__link--coffee
const cssPath = path.join(root, 'src', 'shared.css');
const css = `
.nav__link--coffee {
  background: #FFDD00;
  color: #000 !important;
  font-weight: 700;
  padding: 6px 14px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(255, 221, 0, 0.2);
  text-decoration: none;
}
.nav__link--coffee:hover {
  background: #FFEA00;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 221, 0, 0.4);
}
`;

if (!fs.readFileSync(cssPath, 'utf8').includes('.nav__link--coffee')) {
  fs.appendFileSync(cssPath, css);
  console.log('Added coffee link CSS');
}
