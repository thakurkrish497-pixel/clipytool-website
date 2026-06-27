const fs = require('fs');
const path = require('path');

const seoData1 = require('./seo_data_part1.json');
const seoData2 = require('./seo_data_part2.json');
const seoData3 = require('./seo_data_part3.json');
const seoData = { ...seoData1, ...seoData2, ...seoData3 };

const baseDir = __dirname;
const directories = [
  'crop', 'watermark', 'video-resize', 'video-merge', 'video-to-gif', 'gif-to-video',
  'video-to-mp3', 'video-trimmer', 'video-speed', 'reverse-video', 'mute-video',
  'compress-video', 'rotate-video', 'loop-video', 'video-volume', 'video-to-image'
];

let injectedCount = 0;

for (const dir of directories) {
  const htmlPath = path.join(baseDir, dir, 'index.html');
  if (!fs.existsSync(htmlPath)) continue;

  let content = fs.readFileSync(htmlPath, 'utf8');
  const metadata = seoData[dir];
  if (!metadata) continue;

  // We already injected Meta tags and JSON-LD for ALL tools.
  // We ONLY need to inject the HTML body if it's missing!

  if (!content.includes('class="seo-content"')) {
    console.log(`Injecting SEO body into ${dir}...`);
    
    let seoSection = `
  <!-- Cross-link Banner -->
  <a href="/${dir === 'watermark' ? 'crop' : 'watermark'}/index.html" class="cross-link" id="crossLink">
    <span class="cross-link__text">${dir === 'watermark' ? 'Need to crop or resize your video?' : 'Need to add a logo or text to your video?'}</span>
    <span class="cross-link__cta">Try ${dir === 'watermark' ? 'Crop' : 'Watermark'} Tool &rarr;</span>
  </a>

  <!-- SEO Content -->
  <article class="seo-content">
    <h2>${metadata.h1}</h2>
    <p>${metadata.intro}</p>
    
    <div class="seo-features">
      <div class="feature-box">
        <h3>${metadata.howToTitle}</h3>
        <p>${metadata.howTo.join(' ')}</p>
      </div>
      <div class="feature-box">
        <h3>${metadata.whyTitle}</h3>
        <p>${metadata.whyDesc}</p>
      </div>
    </div>
  </article>

  <!-- FAQ Section -->
  <section class="faq">
    <h2>Frequently Asked Questions</h2>
    <div class="faq-grid">
      ${metadata.faqs.map(item => `
      <details class="faq-item">
        <summary>${item.q} <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></summary>
        <p>${item.a}</p>
      </details>`).join('')}
    </div>
  </section>

  <!-- Footer -->
  <footer class="footer">
    <div class="footer__lock">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
    </div>
    <p>All processing happens locally. Your videos never leave your device.</p>
  </footer>`;

    // Inject after </main>
    if (content.includes('</main>')) {
      content = content.replace('</main>', '</main>\n' + seoSection);
      fs.writeFileSync(htmlPath, content, 'utf8');
      injectedCount++;
    }
  }
}

console.log(`Successfully injected body into ${injectedCount} tools.`);
