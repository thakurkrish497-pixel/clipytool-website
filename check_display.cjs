const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, 'src');

const files = fs.readdirSync(src).filter(f => f.endsWith('.js'));
for (const file of files) {
  const c = fs.readFileSync(path.join(src, file), 'utf8');
  if (c.includes('videoPlayer')) {
    if (!c.includes("dom.videoPlayer.style.display = 'block'") && !c.includes("dom.videoPlayer.classList.remove('hidden')") && !c.includes("dom.videoPlayer.style.display = 'flex'")) {
      console.log('Missing display block in: ' + file);
    }
  }
}
