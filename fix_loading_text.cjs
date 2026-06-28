const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, 'src');

const files = fs.readdirSync(src).filter(f => f.endsWith('.js'));
for (const file of files) {
  const p = path.join(src, file);
  let c = fs.readFileSync(p, 'utf8');
  let orig = c;

  // Replace various 'Loading...' strings right after export starts
  // Usually it looks like: dom.exportBtnText.textContent = 'Loading...';
  // or dom.exportBtnText.textContent = 'Loading FFmpeg…';
  
  c = c.replace(
    /dom\.exportBtnText\.textContent\s*=\s*'Loading[^']*';/g,
    `if (!state.ffmpegLoaded) {
    dom.exportBtnText.textContent = 'Downloading Engine (~30s)...';
  } else {
    dom.exportBtnText.textContent = 'Preparing File...';
  }`
  );

  if (orig !== c) {
    fs.writeFileSync(p, c);
    console.log('Fixed loading text in ' + file);
  }
}
