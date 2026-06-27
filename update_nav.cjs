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

const newNav = `  <nav class="nav">
    <a href="/" class="nav__logo">Clipy Studio<span class="dot">.</span></a>
    <div class="nav__links">
      <a href="/" class="nav__link">Home</a>
      <div class="nav__dropdown">
        <button class="nav__link nav__dropdown-btn">Tools <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></button>
        <div class="nav__dropdown-content">
          <a href="/crop/">Crop Video</a>
          <a href="/watermark/">Watermark Video</a>
          <a href="/video-to-gif/">Video to GIF</a>
          <a href="/gif-maker/">GIF Maker</a>
          <a href="/video-cutter/">Video Cutter</a>
          <a href="/video-to-mp4/">Video to MP4</a>
          <a href="/video-speed/">Video Speed</a>
          <a href="/video-to-image/">Video to Image</a>
          <a href="/video-resize/">Video Resizer</a>
          <a href="/video-rotate/">Video Rotator</a>
          <a href="/video-reverse/">Video Reverser</a>
          <a href="/video-filters/">Video Filters</a>
          <a href="/video-merge/">Video Merger</a>
          <a href="/video-to-webm/">Video to WebM</a>
          <a href="/extract-audio/">Extract Audio</a>
          <a href="/mute-video/">Mute Video</a>
        </div>
      </div>
    </div>
  </nav>

  <!-- Google Ads Placeholder -->
  <div class="ad-container ad-horizontal">
    <div class="ad-placeholder">Advertisement (728x90)</div>
  </div>`;

const baseDir = 'c:/Users/Saket/Desktop/ratio website';

for (const dir of dirs) {
  const filePath = path.join(baseDir, dir, 'index.html');
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove existing ad container if it exists to prevent duplicates
    content = content.replace(/<!-- Google Ads Placeholder -->[\s\S]*?<\/div>\s*<\/div>/g, '');
    content = content.replace(/<div class="ad-container ad-horizontal">[\s\S]*?<\/div>\s*<\/div>/g, '');
    
    // Replace existing nav
    content = content.replace(/<nav class="nav">[\s\S]*?<\/nav>/, newNav);
    
    // Fallback: If no nav was replaced (maybe it wasn't there), we don't handle it well here, but all files should have it.

    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  } else {
    console.log(`Not found: ${filePath}`);
  }
}
