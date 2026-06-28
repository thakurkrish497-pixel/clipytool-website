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

for (const file of htmlFiles) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('https://formspree.io/f/YOUR_FORM_ID')) {
    content = content.replace('https://formspree.io/f/YOUR_FORM_ID', 'https://formspree.io/f/mykqjdoq');
    fs.writeFileSync(file, content);
    console.log('Updated Formspree URL in:', file);
  }
}
