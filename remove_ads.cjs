const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git')) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.html')) {
      results.push(file);
    }
  });
  return results;
}

const htmlFiles = walk(__dirname);

htmlFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Remove the Google Ads Placeholder blocks
  // They look like:
  // <!-- Google Ads Placeholder -->
  // <div class="ad-container ad-horizontal">
  //   <div class="ad-placeholder">Advertisement (728x90)</div>
  // </div>
  const regex = /<!-- Google Ads Placeholder -->\s*<div class="ad-container ad-horizontal">\s*<div class="ad-placeholder">Advertisement \(728x90\)<\/div>\s*<\/div>/g;
  
  if (regex.test(content)) {
    content = content.replace(regex, '');
    fs.writeFileSync(file, content);
    console.log('Removed manual ads from ' + file);
  }
});
