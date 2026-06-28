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

patchFile('watermark.js', (c) => c.replace(/'-c:a', 'copy',/g, "'-c:a', 'copy',\n      '-threads', '4',\n      '-preset', 'ultrafast',"));
patchFile('crop.js', (c) => c.replace(/'-c:a', 'copy',/g, "'-c:a', 'copy',\n      '-threads', '4',\n      '-preset', 'ultrafast',"));
patchFile('video-resize.js', (c) => c.replace(/'-c:a', 'copy',/g, "'-c:a', 'copy',\n      '-threads', '4',\n      '-preset', 'ultrafast',"));
patchFile('video-rotate.js', (c) => c.replace(/'-c:a', 'copy',/g, "'-c:a', 'copy',\n      '-threads', '4',\n      '-preset', 'ultrafast',"));
patchFile('video-filters.js', (c) => c.replace(/'-c:a', 'copy',/g, "'-c:a', 'copy',\n      '-threads', '4',\n      '-preset', 'ultrafast',"));

patchFile('video-speed.js', (c) => c.replace(/args\.push\('-c:v', 'libx264'\);/, "args.push('-c:v', 'libx264', '-threads', '4', '-preset', 'ultrafast');"));
patchFile('video-reverse.js', (c) => c.replace(/args\.push\('-c:v', 'libx264'\);/, "args.push('-c:v', 'libx264', '-threads', '4', '-preset', 'ultrafast');"));

patchFile('video-to-mp4.js', (c) => c.replace(/'-preset', preset,/g, "'-preset', preset,\n      '-threads', '4',"));
patchFile('video-to-webm.js', (c) => c.replace(/'-b:v', bitrate,/g, "'-b:v', bitrate,\n      '-threads', '4',\n      '-deadline', 'realtime',\n      '-cpu-used', '4',"));
patchFile('video-to-gif.js', (c) => c.replace(/'-r', framerate,/g, "'-r', framerate,\n      '-threads', '4',"));
patchFile('gif-maker.js', (c) => c.replace(/'-r', framerate,/g, "'-r', framerate,\n      '-threads', '4',"));
patchFile('video-cutter.js', (c) => c.replace(/'-c:v', 'libx264',/g, "'-c:v', 'libx264',\n      '-threads', '4',\n      '-preset', 'ultrafast',"));
