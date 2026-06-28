const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, 'src');

const files = fs.readdirSync(src).filter(f => f.endsWith('.js'));
for (const file of files) {
  const c = fs.readFileSync(path.join(src, file), 'utf8');
  if (c.includes('setupVideoUpload')) {
    if (!c.includes('dom.videoPlayer.src') || !c.includes('URL.createObjectURL')) {
      console.log('Missing video preview in: ' + file);
    }
  } else if (c.includes('videoPlayer')) {
    if (!c.includes('dom.videoPlayer.src') || !c.includes('URL.createObjectURL')) {
      console.log('Missing video preview in: ' + file);
    }
  }
}
