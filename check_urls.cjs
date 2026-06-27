const fs = require('fs');
const path = require('path');

const dirs = [
  '/', '/crop/', '/watermark/', '/video-to-gif/', '/gif-maker/', '/video-cutter/',
  '/video-to-mp4/', '/video-speed/', '/video-to-image/', '/video-resize/',
  '/video-rotate/', '/video-reverse/', '/video-filters/', '/video-merge/',
  '/video-to-webm/', '/extract-audio/', '/mute-video/'
];

for (const dir of dirs) {
  const filePath = path.join(__dirname, dir, 'index.html');
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = content.match(/href="([^"]*)"/g) || [];
    const srcMatches = content.match(/src="([^"]*)"/g) || [];
    
    [...matches, ...srcMatches].forEach(match => {
      const url = match.split('"')[1];
      if (url === '/' || url === '' || url.endsWith('/')) {
        console.log(`Suspicious URL in ${filePath}: ${url}`);
      }
    });
  }
}
