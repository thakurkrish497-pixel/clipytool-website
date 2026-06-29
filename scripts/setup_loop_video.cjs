const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'loop-video', 'index.html');
let htmlContent = fs.readFileSync(htmlPath, 'utf8');

// HTML Replacements
htmlContent = htmlContent.replace(
  /<title>.*?<\/title>/,
  '<title>Loop Video Online (Repeat Video Free) | Clipy Studio</title>'
);
htmlContent = htmlContent.replace(
  /<meta name="description"\s+content=".*?" \/>/s,
  '<meta name="description" content="Quickly loop video online and repeat videos multiple times for free. Perfect for Instagram, TikTok, or endless replays. Runs locally in your browser." />'
);
htmlContent = htmlContent.replace(
  /<meta property="og:title" content=".*?" \/>/,
  '<meta property="og:title" content="Loop Video Online (Repeat Video Free) | Clipy Studio" />'
);
htmlContent = htmlContent.replace(
  /<meta property="og:description" content=".*?" \/>/,
  '<meta property="og:description" content="Quickly loop video online and repeat videos multiple times for free. Perfect for Instagram, TikTok, or endless replays. Runs locally in your browser." />'
);
htmlContent = htmlContent.replace(
  /<meta property="og:url" content=".*?" \/>/,
  '<meta property="og:url" content="https://clipystudio.com/loop-video/" />'
);
htmlContent = htmlContent.replace(
  /<meta name="twitter:title" content=".*?" \/>/,
  '<meta name="twitter:title" content="Loop Video Online (Repeat Video Free) | Clipy Studio" />'
);
htmlContent = htmlContent.replace(
  /<meta name="twitter:description" content=".*?" \/>/,
  '<meta name="twitter:description" content="Quickly loop video online and repeat videos multiple times for free. Perfect for Instagram, TikTok, or endless replays. Runs locally in your browser." />'
);
htmlContent = htmlContent.replace(
  /<link rel="canonical" href=".*?" \/>/,
  '<link rel="canonical" href="https://clipystudio.com/loop-video/" />'
);

// Schema
htmlContent = htmlContent.replace('Clipy Studio Video Compressor', 'Clipy Studio Video Looper');
htmlContent = htmlContent.replace('Compress your videos entirely in the browser.', 'Loop your videos entirely in the browser.');

// CSS and JS links
htmlContent = htmlContent.replace('/src/compress-video.css', '/src/loop-video.css');
htmlContent = htmlContent.replace('/src/compress-video.js', '/src/loop-video.js');

// Card 3
const card3Replacement = `
    <!-- Card 3: Loop Settings -->
    <section class="card card--resize-settings">
      <div class="card__header">
        <div class="card__title-group">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
          </svg>
          <h2 class="card__title">Loop Count</h2>
        </div>
      </div>
      
      <div class="resize-controls">
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <label style="font-size: 0.85rem; font-weight: 500; color: var(--text-secondary);">Number of times to repeat</label>
          <div style="display: flex; align-items: center; gap: 12px;">
            <input type="range" id="loopCount" min="2" max="20" value="2" style="flex: 1;" />
            <span id="loopValue" style="font-family: monospace; font-size: 0.9rem; font-weight: 700; color: var(--primary-color);">2</span>
          </div>
          <p style="font-size: 0.75rem; color: var(--text-tertiary); margin: 0;">e.g., 2 times makes the video twice as long</p>
        </div>
      </div>
    </section>
`;
htmlContent = htmlContent.replace(/<!-- Card 3: Compression Settings -->[\s\S]*?<\/section>/, card3Replacement.trim());

// Button Text
htmlContent = htmlContent.replace('Compress Video', 'Loop Video');
htmlContent = htmlContent.replace('compress-bento', 'loop-bento');

// SEO Content
const seoContent = `
  <!-- SEO Content -->
  <article class="seo-content">
    <h2>Loop Video Online (Fast & Private)</h2>
    <p>Need to repeat a video endlessly? Our free browser tool lets you easily loop video online in seconds. Because it runs locally on your device, you can repeat footage without any slow server uploads or privacy risks.</p>
    
    <div class="seo-features">
      <div class="feature-box">
        <h3>How to Loop Video Online</h3>
        <p>Upload your file, select how many times to repeat it, and click loop. It's the perfect way to create seamless replays for TikTok and Instagram.</p>
      </div>
      <div class="feature-box">
        <h3>Why Use Our Free Video Looper?</h3>
        <p>Most video loopers make you upload your file to their servers. Clipy Studio bypasses the cloud entirely using WebAssembly. This allows you to loop video online instantly using your own hardware, guaranteeing absolute privacy and blazing-fast processing speeds.</p>
      </div>
    </div>
  </article>
`;
htmlContent = htmlContent.replace(/<!-- SEO Content -->[\s\S]*?<\/article>/, seoContent.trim());

fs.writeFileSync(htmlPath, htmlContent, 'utf8');
console.log('Modified loop-video/index.html');


// JS File Replacements
const jsPath = path.join(__dirname, '..', 'src', 'loop-video.js');
let jsContent = fs.readFileSync(jsPath, 'utf8');

jsContent = jsContent.replace("compressQuality: document.getElementById('compressQuality')", "loopCount: document.getElementById('loopCount')");
jsContent = jsContent.replace("qualityValue: document.getElementById('qualityValue')", "loopValue: document.getElementById('loopValue')");

jsContent = jsContent.replace('setupCompressControls', 'setupLoopControls');
jsContent = jsContent.replace('setupCompressControls', 'setupLoopControls');

jsContent = jsContent.replace(/dom.compressQuality/g, 'dom.loopCount');
jsContent = jsContent.replace(/dom.qualityValue/g, 'dom.loopValue');

jsContent = jsContent.replace("dom.btnExport.addEventListener('click', processCompress)", "dom.btnExport.addEventListener('click', processLoop)");
jsContent = jsContent.replace("async function processCompress", "async function processLoop");

// Replace ffmpeg exec logic for looping
const ffmpegExec = `
    const loops = parseInt(dom.loopCount ? dom.loopCount.value : '2');
    
    // Create concat string
    let concatStr = '';
    for(let i=0; i<loops; i++) {
        concatStr += \`file '\${inputName}'\\n\`;
    }
    await ffmpeg.writeFile('list.txt', concatStr);

    dom.exportBtnText.textContent = 'Looping video...';
    
    await ffmpeg.exec([
      '-f', 'concat',
      '-safe', '0',
      '-i', 'list.txt',
      '-c', 'copy',
      outName
    ]);
`;
jsContent = jsContent.replace(/const crf =.*?await ffmpeg.exec\([\s\S]*?\]\);/s, ffmpegExec.trim());

jsContent = jsContent.replace("exportBtnText.textContent = 'Download Compressed Video'", "exportBtnText.textContent = 'Download Looped Video'");

fs.writeFileSync(jsPath, jsContent, 'utf8');
console.log('Modified src/loop-video.js');
