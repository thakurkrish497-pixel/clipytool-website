const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

const newFooter = `  <footer class="footer">
    <div class="footer-container">
      <div class="footer-columns">
        <div class="footer-col">
          <h4>Video Editors</h4>
          <a href="/video-cutter/index.html">Video Cutter</a>
          <a href="/video-merge/index.html">Video Merger</a>
          <a href="/crop/index.html">Crop Video</a>
          <a href="/video-resize/index.html">Resize Video</a>
          <a href="/watermark/index.html">Watermark Video</a>
          <a href="/video-filters/index.html">Video Filters</a>
        </div>
        <div class="footer-col">
          <h4>Video Converters</h4>
          <a href="/compress-video/index.html">Compress Video</a>
          <a href="/video-to-mp4/index.html">Video to MP4</a>
          <a href="/video-to-webm/index.html">Video to WebM</a>
          <a href="/video-to-image/index.html">Video to Image</a>
          <a href="/video-to-gif/index.html">Video to GIF</a>
          <a href="/gif-maker/index.html">GIF Maker</a>
        </div>
        <div class="footer-col">
          <h4>Video Effects</h4>
          <a href="/video-speed/index.html">Video Speed</a>
          <a href="/video-rotate/index.html">Rotate Video</a>
          <a href="/video-reverse/index.html">Reverse Video</a>
          <a href="/loop-video/index.html">Loop Video</a>
          <a href="/mute-video/index.html">Mute Video</a>
          <a href="/extract-audio/index.html">Extract Audio</a>
        </div>
        <div class="footer-col">
          <h4>Clipy Studio</h4>
          <a href="/index.html">Home</a>
        </div>
      </div>
      <div class="footer-bottom">
        <div class="footer-bottom__lock">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <p>All processing happens locally. Your files never leave your device.</p>
      </div>
    </div>
  </footer>`;

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (!file.startsWith('.') && file !== 'node_modules' && file !== 'dist' && file !== 'scripts' && file !== 'public') {
                processDir(fullPath);
            }
        } else if (file.endsWith('.html')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            const footerRegex = /<footer[^>]*>[\s\S]*?<\/footer>/g;
            if (footerRegex.test(content)) {
                let count = 0;
                content = content.replace(footerRegex, () => {
                    count++;
                    return count === 1 ? newFooter : ''; // Keep first as newFooter, delete rest
                });
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Injected footer into ${fullPath}`);
            } else if (content.includes('</body>')) {
                content = content.replace('</body>', newFooter + '\n</body>');
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Appended footer to ${fullPath}`);
            }
        }
    }
}

processDir(rootDir);
console.log('Footer injection complete!');
