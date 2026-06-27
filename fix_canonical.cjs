const fs = require('fs');
const path = require('path');

const dirs = [
  '/',
  '/crop/',
  '/watermark/',
  '/video-to-gif/',
  '/gif-maker/',
  '/video-cutter/',
  '/video-to-mp4/',
  '/video-speed/',
  '/video-to-image/',
  '/video-resize/',
  '/video-rotate/',
  '/video-reverse/',
  '/video-filters/',
  '/video-merge/',
  '/video-to-webm/',
  '/extract-audio/',
  '/mute-video/'
];

const baseDir = 'c:/Users/Saket/Desktop/ratio website';

for (const dir of dirs) {
  const filePath = path.join(baseDir, dir, 'index.html');
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Change relative canonical URLs to absolute URLs
    content = content.replace(/<link rel="canonical" href="\/([^"]*)" \/>/g, '<link rel="canonical" href="https://clipystudio.com/$1" />');
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated canonical in ${filePath}`);
  }
}
