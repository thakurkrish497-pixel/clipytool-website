const fs = require('fs');
const path = require('path');
const checkFile = (f) => { 
  const c = fs.readFileSync(f,'utf8'); 
  const m = c.match(/(href|src)="([^"]*)"/g); 
  if(m){ 
    m.forEach(x => { 
      const v = x.split('"')[1]; 
      if(v === '' || v === '/' || v.endsWith('/')){ 
        console.log('Found empty or slash in ' + f + ': ' + x); 
      } 
    }); 
  } 
}; 
checkFile('index.html'); 
fs.readdirSync('.').forEach(d => { 
  if(fs.statSync(d).isDirectory() && fs.existsSync(d+'/index.html')) {
    checkFile(d+'/index.html'); 
  }
});
