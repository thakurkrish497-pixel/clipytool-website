const fs = require('fs');
const path = require('path');
const dir = './src';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
for (const file of files) {
  const p = path.join(dir, file);
  let c = fs.readFileSync(p, 'utf8');
  
  c = c.replace(/alert\(Load Error: \);/g, 'alert("Load Error: " + (err.message || err));');
  c = c.replace(/alert\(Error: \);/g, 'alert("Error: " + (err.message || err));');
  
  if (c !== fs.readFileSync(p, 'utf8')) {
    fs.writeFileSync(p, c);
    console.log('Fixed ' + file);
  }
}
