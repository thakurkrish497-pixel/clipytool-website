const fs = require('fs');
const path = require('path');

const cssDir = path.join(__dirname, 'src');
const files = fs.readdirSync(cssDir).filter(f => f.endsWith('.css') && f !== 'shared.css' && f !== 'landing.css');

files.forEach(file => {
  const filePath = path.join(cssDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove grid definitions from .xxx-bento classes
  content = content.replace(/\.[a-z0-9-]+-bento\s*{[\s\S]*?}/, (match) => {
    // Keep the block but remove columns and rows overrides so it inherits shared.css 3-column layout
    return match.replace(/grid-template-columns:[^;]+;/, '').replace(/grid-template-rows:[^;]+;/, '');
  });

  // Change left-side preview/workspace cards to span 2 columns
  content = content.replace(/grid-column:\s*1\s*;/g, 'grid-column: 1 / 3;');
  
  // Change right-side cards to sit in the 3rd column
  content = content.replace(/grid-column:\s*2\s*;/g, 'grid-column: 3;');

  fs.writeFileSync(filePath, content);
  console.log('Updated ' + file);
});
