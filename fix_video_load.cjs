const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, 'src');

const files = fs.readdirSync(src).filter(f => f.endsWith('.js'));
for (const file of files) {
  const p = path.join(src, file);
  let c = fs.readFileSync(p, 'utf8');
  let orig = c;

  if (c.includes('dom.videoPlayer.src = state.videoURL;') && !c.includes('dom.videoPlayer.load();')) {
    const replacement = `  dom.videoPlayer.src = state.videoURL;
  dom.videoPlayer.load();
  dom.videoPlayer.onerror = () => {
    if(dom.fileNameVid) dom.fileNameVid.textContent = file.name;
    if(dom.fileDetailsVid) dom.fileDetailsVid.textContent = 'Preview unavailable for this format';
    if(dom.dropzoneVid) dom.dropzoneVid.style.display = 'none';
    if(dom.fileInfoVid) dom.fileInfoVid.style.display = 'flex';
    if(dom.videoEmpty) dom.videoEmpty.style.display = 'none';
    dom.videoPlayer.style.display = 'none';
    if(dom.videoControls) dom.videoControls.style.display = 'none';
    if(typeof updateExportState === 'function') updateExportState();
    if(typeof preloadFFmpeg === 'function') preloadFFmpeg();
  };`;
    
    c = c.replace(/dom\.videoPlayer\.src = state\.videoURL;/g, replacement);
  }

  if (orig !== c) {
    fs.writeFileSync(p, c);
    console.log('Fixed video load logic in: ' + file);
  }
}
