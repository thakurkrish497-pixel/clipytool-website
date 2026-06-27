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
  '/video-to-image/'
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
    
    // Replace existing nav
    content = content.replace(/<nav class="nav">[\s\S]*?<\/nav>/, newNav);
    
    // Some pages might already have it if ran twice, so let's be careful
    // Actually the regex replaces the whole nav. But the new block has the ad container.
    // Let's just ensure we don't duplicate ad containers.
    content = content.replace(/<!-- Google Ads Placeholder -->[\s\S]*?<\/div>\s*<\/div>/g, '');
    content = content.replace(/<nav class="nav">[\s\S]*?<\/nav>/, newNav);

    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
}
