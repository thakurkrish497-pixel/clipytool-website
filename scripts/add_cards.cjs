const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
let content = fs.readFileSync(indexPath, 'utf8');

const newCards = `
    <!-- Compress Video Tool Card -->
    <a href="/compress-video/index.html" class="tool-card" id="toolCompress">
      <div class="tool-card__icon-area">
        <div class="tool-card__icon" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="M8 17l4 4 4-4"/>
          </svg>
        </div>
        <span class="tool-card__badge">Free</span>
      </div>
      <h2 class="tool-card__title">Video Compressor</h2>
      <p class="tool-card__desc">Reduce video file size instantly in your browser. Optimize for Discord, email, or social media without losing quality.</p>
      <ul class="tool-card__features">
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> No file size limits</li>
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> 100% Private (No uploads)</li>
      </ul>
      <div class="tool-card__cta">
        <span>Compress Video</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
      </div>
    </a>

    <!-- Loop Video Tool Card -->
    <a href="/loop-video/index.html" class="tool-card" id="toolLoop">
      <div class="tool-card__icon-area">
        <div class="tool-card__icon" style="background: rgba(139, 92, 246, 0.1); color: #8b5cf6;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
          </svg>
        </div>
        <span class="tool-card__badge">Free</span>
      </div>
      <h2 class="tool-card__title">Video Looper</h2>
      <p class="tool-card__desc">Repeat your video seamlessly. Extend short clips for endless replays on Instagram and TikTok directly in your browser.</p>
      <ul class="tool-card__features">
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Endless repeats</li>
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> 100% Private (No uploads)</li>
      </ul>
      <div class="tool-card__cta">
        <span>Loop Video</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
      </div>
    </a>
`;

if (!content.includes('toolCompress')) {
  content = content.replace(
    '<main class="tools-grid" id="toolsGrid">',
    '<main class="tools-grid" id="toolsGrid">\n' + newCards
  );
  fs.writeFileSync(indexPath, content, 'utf8');
  console.log('Added cards to index.html');
} else {
  console.log('Cards already present.');
}
