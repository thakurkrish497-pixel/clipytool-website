const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'compress-video', 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

// Replace meta tags and title
content = content.replace(
  /<title>.*?<\/title>/,
  '<title>Compress Video Online (Reduce File Size Free) | Clipy Studio</title>'
);
content = content.replace(
  /<meta name="description"\s+content=".*?" \/>/s,
  '<meta name="description" content="Quickly compress video online and reduce video file size for free. Perfect for email, Discord, or social media. Runs locally in your browser." />'
);
content = content.replace(
  /<meta property="og:title" content=".*?" \/>/,
  '<meta property="og:title" content="Compress Video Online (Reduce File Size Free) | Clipy Studio" />'
);
content = content.replace(
  /<meta property="og:description" content=".*?" \/>/,
  '<meta property="og:description" content="Quickly compress video online and reduce video file size for free. Perfect for email, Discord, or social media. Runs locally in your browser." />'
);
content = content.replace(
  /<meta property="og:url" content=".*?" \/>/,
  '<meta property="og:url" content="https://clipystudio.com/compress-video/" />'
);
content = content.replace(
  /<meta name="twitter:title" content=".*?" \/>/,
  '<meta name="twitter:title" content="Compress Video Online (Reduce File Size Free) | Clipy Studio" />'
);
content = content.replace(
  /<meta name="twitter:description" content=".*?" \/>/,
  '<meta name="twitter:description" content="Quickly compress video online and reduce video file size for free. Perfect for email, Discord, or social media. Runs locally in your browser." />'
);
content = content.replace(
  /<link rel="canonical" href=".*?" \/>/,
  '<link rel="canonical" href="https://clipystudio.com/compress-video/" />'
);

// Replace schema
content = content.replace('Clipy Studio Video Resizer', 'Clipy Studio Video Compressor');
content = content.replace('Resize your videos entirely in the browser.', 'Compress your videos entirely in the browser.');

// Replace CSS and JS links
content = content.replace('/src/video-resize.css', '/src/compress-video.css');
content = content.replace('/src/video-resize.js', '/src/compress-video.js');

// Replace card 3
const card3Replacement = `
    <!-- Card 3: Compression Settings -->
    <section class="card card--resize-settings">
      <div class="card__header">
        <div class="card__title-group">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/>
          </svg>
          <h2 class="card__title">Compression Quality</h2>
        </div>
      </div>
      
      <div class="resize-controls">
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <label style="font-size: 0.85rem; font-weight: 500; color: var(--text-secondary);">Quality Level (CRF)</label>
          <div style="display: flex; align-items: center; gap: 12px;">
            <input type="range" id="compressQuality" min="18" max="40" value="28" style="flex: 1;" />
            <span id="qualityValue" style="font-family: monospace; font-size: 0.9rem; font-weight: 700; color: var(--primary-color);">28</span>
          </div>
          <p style="font-size: 0.75rem; color: var(--text-tertiary); margin: 0;">Higher value = Smaller file size but lower quality (Default: 28)</p>
        </div>
      </div>
    </section>
`;
content = content.replace(/<!-- Card 3: Resize Settings -->[\s\S]*?<\/section>/, card3Replacement.trim());

// Replace Export Button Text
content = content.replace('Resize Video', 'Compress Video');
content = content.replace('resize-bento', 'compress-bento');

// Replace SEO content
const seoContent = `
  <!-- SEO Content -->
  <article class="seo-content">
    <h2>Compress Video Online (Fast & Private)</h2>
    <p>Need to reduce a video file size for Discord, email, or social media? Our free browser tool lets you easily compress video online in seconds. Because it runs locally on your device, you can compress footage without any slow server uploads or privacy risks.</p>
    
    <div class="seo-features">
      <div class="feature-box">
        <h3>How to Compress Video Online</h3>
        <p>Upload your file, adjust the quality slider, and click compress. It's that easy to reduce video file sizes.</p>
      </div>
      <div class="feature-box">
        <h3>Why Use Our Free Video Compressor?</h3>
        <p>Large video files take forever to upload to standard cloud compressors. Clipy Studio bypasses the cloud entirely using WebAssembly. This allows you to compress video online instantly using your own hardware, guaranteeing absolute privacy and blazing-fast processing speeds.</p>
      </div>
    </div>
  </article>
`;
content = content.replace(/<!-- SEO Content -->[\s\S]*?<\/article>/, seoContent.trim());

fs.writeFileSync(filePath, content, 'utf8');
console.log('Modified compress-video/index.html');
