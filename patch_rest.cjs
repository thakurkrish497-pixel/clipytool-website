const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, 'src');

function patchFile(file, replacer) {
  const p = path.join(src, file);
  if (!fs.existsSync(p)) return;
  const orig = fs.readFileSync(p, 'utf8');
  const res = replacer(orig);
  if (orig !== res) {
    fs.writeFileSync(p, res);
    console.log('Patched ' + file);
  }
}

patchFile('video-to-webm.js', (c) => c.replace(/'-b:v', bv,/g, "'-b:v', bv,\n      '-threads', '4',\n      '-deadline', 'realtime',\n      '-cpu-used', '4',"));
patchFile('video-to-gif.js', (c) => c.replace(/'-filter_complex'/g, "'-threads', '4',\n      '-filter_complex'"));
patchFile('gif-maker.js', (c) => c.replace(/'-filter_complex'/g, "'-threads', '4',\n      '-filter_complex'"));
patchFile('video-to-image.js', (c) => c.replace(/await ffmpeg\.exec\(\[/g, "await ffmpeg.exec([\n      '-threads', '4',"));
patchFile('extract-audio.js', (c) => c.replace(/args\.push\(outName\);/g, "args.push('-threads', '4', outName);"));
