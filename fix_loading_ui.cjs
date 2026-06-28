const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, 'src');

const files = fs.readdirSync(src).filter(f => f.endsWith('.js'));
for (const file of files) {
  const p = path.join(src, file);
  let c = fs.readFileSync(p, 'utf8');
  let orig = c;

  c = c.replace(
    /if \(!state\.ffmpegLoaded\) await preloadFFmpeg\(\);/g,
    `if (!state.ffmpegLoaded) {
      dom.exportBtnText.textContent = 'Downloading Engine (~30s)...';
      await preloadFFmpeg();
      dom.exportBtnText.textContent = 'Preparing File...';
    }`
  );

  // For files that have multi-line block like `if (!state.ffmpegLoaded) { await preloadFFmpeg(); ... }`
  c = c.replace(
    /if \(!state\.ffmpegLoaded\) \{\s*await preloadFFmpeg\(\);/g,
    `if (!state.ffmpegLoaded) {
      dom.exportBtnText.textContent = 'Downloading Engine (~30s)...';
      await preloadFFmpeg();`
  );

  if (orig !== c) {
    fs.writeFileSync(p, c);
    console.log('Fixed UX logic in ' + file);
  }
}
