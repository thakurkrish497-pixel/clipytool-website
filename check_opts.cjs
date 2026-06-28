const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, 'src');

const files = fs.readdirSync(src).filter(f => f.endsWith('.js'));
for (const file of files) {
  const c = fs.readFileSync(path.join(src, file), 'utf8');
  if (c.includes('ffmpeg.exec')) {
    if (!c.includes("threads") || (!c.includes("ultrafast") && !c.includes("realtime") && !c.includes("copy"))) {
      console.log('MISSING OPTIMIZATIONS IN: ' + file);
    }
  }
}
