const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, 'src');

function patchFile(fileName) {
  const p = path.join(src, fileName);
  if (!fs.existsSync(p)) return;
  let c = fs.readFileSync(p, 'utf8');
  let orig = c;

  // Add ultrafast and threads to args
  if (!c.includes("'-preset', 'ultrafast'")) {
    c = c.replace(/args\.push\(outputName\);/g, "args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-threads', '4', outputName);");
    c = c.replace(/args\.push\(outName\);/g, "args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-threads', '4', outName);");
  }

  // Add 100% jump at the end
  if (!c.includes("style.width = '100%';")) {
    c = c.replace(/await ffmpeg\.exec\(args\);/g, "await ffmpeg.exec(args);\n    dom.exportFill.style.width = '100%';\n    dom.exportBtnText.textContent = 'Processing... 100%';");
  }

  if (orig !== c) {
    fs.writeFileSync(p, c);
    console.log('Patched ' + fileName);
  }
}

patchFile('video-speed.js');
patchFile('video-reverse.js');
patchFile('extract-audio.js'); // check if it needs 100% jump
