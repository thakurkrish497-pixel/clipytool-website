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
    
    // Replace all bare directory hrefs with explicit index.html across ALL files
    content = content.replace(/href="\/crop\/"/g, 'href="/crop/index.html"');
    content = content.replace(/href="\/watermark\/"/g, 'href="/watermark/index.html"');
    content = content.replace(/href="\/video-to-gif\/"/g, 'href="/video-to-gif/index.html"');
    content = content.replace(/href="\/gif-maker\/"/g, 'href="/gif-maker/index.html"');
    content = content.replace(/href="\/video-cutter\/"/g, 'href="/video-cutter/index.html"');
    content = content.replace(/href="\/video-to-mp4\/"/g, 'href="/video-to-mp4/index.html"');
    content = content.replace(/href="\/video-speed\/"/g, 'href="/video-speed/index.html"');
    content = content.replace(/href="\/video-to-image\/"/g, 'href="/video-to-image/index.html"');
    content = content.replace(/href="\/video-resize\/"/g, 'href="/video-resize/index.html"');
    content = content.replace(/href="\/video-rotate\/"/g, 'href="/video-rotate/index.html"');
    content = content.replace(/href="\/video-reverse\/"/g, 'href="/video-reverse/index.html"');
    content = content.replace(/href="\/video-filters\/"/g, 'href="/video-filters/index.html"');
    content = content.replace(/href="\/video-merge\/"/g, 'href="/video-merge/index.html"');
    content = content.replace(/href="\/video-to-webm\/"/g, 'href="/video-to-webm/index.html"');
    content = content.replace(/href="\/extract-audio\/"/g, 'href="/extract-audio/index.html"');
    content = content.replace(/href="\/mute-video\/"/g, 'href="/mute-video/index.html"');
    
    // Replace href="/" except canonical
    // First, let's temporarily hide canonical so it isn't touched
    content = content.replace(/<link rel="canonical" href="\/" \/>/g, 'CANONICAL_ROOT_PLACEHOLDER');
    content = content.replace(/href="\/"/g, 'href="/index.html"');
    content = content.replace(/CANONICAL_ROOT_PLACEHOLDER/g, '<link rel="canonical" href="/" />');

    // Replace existing nav
    content = content.replace(/<nav class="nav"[^>]*>[\s\S]*?<\/nav>/, newNav);

    // Fix any canonical links that got index.html appended by mistake
    content = content.replace(/<link rel="canonical" href="\/([^\/]+)\/index.html" \/>/g, '<link rel="canonical" href="/$1/" />');
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
}
