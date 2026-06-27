const fs = require('fs');
const path = require('path');

const cssDir = path.join(__dirname, 'src');
const files = fs.readdirSync(cssDir).filter(f => f.endsWith('.css') && f !== 'shared.css' && f !== 'landing.css');

const responsiveBlock = `/* ---- Responsive ---- */
@media (max-width: 1024px) {
  main.bento {
    grid-template-columns: 1fr !important;
    grid-template-rows: auto !important;
    height: auto !important;
  }
  .card {
    grid-column: 1 !important;
    grid-row: auto !important;
  }
}`;

files.forEach(file => {
  const filePath = path.join(cssDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find the @media (max-width: 900px) block
  // We use a regex to match from @media (max-width: 900px) down to the end of the file.
  // This assumes the media query is at the very end of the CSS file.
  const regex = /\/\* ---- Responsive ---- \*\/[\s\S]*@media[\s\S]*$/;
  
  if (regex.test(content)) {
    content = content.replace(regex, responsiveBlock);
  } else {
    // If there's no matching block but there's a @media 900px
    const fallbackRegex = /@media\s*\(\s*max-width:\s*900px\s*\)[\s\S]*$/;
    if (fallbackRegex.test(content)) {
      content = content.replace(fallbackRegex, responsiveBlock);
    } else {
      // Append it if not found
      content += '\n\n' + responsiveBlock;
    }
  }
  
  fs.writeFileSync(filePath, content);
  console.log('Updated ' + file);
});
