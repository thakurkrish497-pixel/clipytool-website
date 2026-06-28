const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, 'src');

const files = fs.readdirSync(src).filter(f => f.endsWith('.js'));
for (const file of files) {
  const p = path.join(src, file);
  let c = fs.readFileSync(p, 'utf8');
  let orig = c;

  // Most files have `await ffmpeg.exec(args);` or `await ffmpeg.exec([...]);`
  // We want to add the 100% jump immediately after it.
  
  if (!c.includes("style.width = '100%';")) {
    c = c.replace(/await ffmpeg\.exec\(args\);/g, "await ffmpeg.exec(args);\n    dom.exportFill.style.width = '100%';\n    dom.exportBtnText.textContent = 'Processing... 100%';");
    
    // For arrays, e.g. await ffmpeg.exec([\n...\n]);
    // The easiest way is to match `]);` right after `await ffmpeg.exec`
    // We can use a regex to find `await ffmpeg.exec([ ... ]);`
    // Actually, just replace `]);` with `]);\n    dom.exportFill.style.width = '100%';\n    dom.exportBtnText.textContent = 'Processing... 100%';` but only if it's ffmpeg.exec
    c = c.replace(/await ffmpeg\.exec\(\[([^\]]*)\]\);/g, (match) => {
      return match + "\n    dom.exportFill.style.width = '100%';\n    dom.exportBtnText.textContent = 'Processing... 100%';";
    });
  }

  if (orig !== c) {
    fs.writeFileSync(p, c);
    console.log('Added 100% jump to ' + file);
  }
}
