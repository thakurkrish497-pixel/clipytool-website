const fs = require('fs');
const path = require('path');

const root = __dirname;
const htmlFiles = [];

// Find all index.html files
htmlFiles.push(path.join(root, 'index.html'));

const dirs = fs.readdirSync(root, { withFileTypes: true });
for (const dir of dirs) {
  if (dir.isDirectory() && dir.name !== 'node_modules' && dir.name !== 'dist' && dir.name !== 'src' && dir.name !== 'public') {
    const indexPath = path.join(root, dir.name, 'index.html');
    if (fs.existsSync(indexPath)) {
      htmlFiles.push(indexPath);
    }
  }
}

const injection = `
  <!-- Feedback System -->
  <button class="feedback-fab" id="feedbackFab" aria-label="Provide Feedback">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
    </svg>
    <span>Feedback</span>
  </button>

  <div class="feedback-modal" id="feedbackModal">
    <div class="feedback-modal__content">
      <div class="feedback-modal__header">
        <h3>Help us improve!</h3>
        <button class="btn-close-feedback" id="btnCloseFeedback" aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <form class="feedback-form" action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
        <label class="feedback-label">
          How are the tools working for you?
          <textarea name="experience" rows="3" placeholder="I love the tools, but..." required></textarea>
        </label>
        <label class="feedback-label">
          What new tools should we add next?
          <textarea name="new_tools" rows="2" placeholder="I really need a video compressor..."></textarea>
        </label>
        <label class="feedback-label">
          Email (Optional, if you want a reply)
          <input type="email" name="email" placeholder="you@example.com" />
        </label>
        <button type="submit" class="feedback-submit">Send Feedback</button>
      </form>
    </div>
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', () => {
      const fab = document.getElementById('feedbackFab');
      const modal = document.getElementById('feedbackModal');
      const closeBtn = document.getElementById('btnCloseFeedback');

      if (fab && modal && closeBtn) {
        fab.addEventListener('click', () => {
          modal.classList.add('open');
        });

        closeBtn.addEventListener('click', () => {
          modal.classList.remove('open');
        });

        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.classList.remove('open');
          }
        });
      }
    });
  </script>
</body>`;

for (const file of htmlFiles) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('id="feedbackFab"')) {
    content = content.replace('</body>', injection);
    fs.writeFileSync(file, content);
    console.log('Injected feedback into:', file);
  }
}
