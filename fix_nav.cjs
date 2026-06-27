const fs = require('fs');
const path = require('path');

const dirs = [
  'crop', 'watermark', 'video-resize', 'video-merge', 'video-to-gif', 'gif-to-video',
  'video-to-mp3', 'video-trimmer', 'video-speed', 'reverse-video', 'mute-video',
  'compress-video', 'rotate-video', 'loop-video', 'video-volume', 'video-to-image',
  'extract-audio', 'video-filters', 'video-cutter', 'video-to-mp4', 'video-to-webm', 'gif-maker'
];

const scriptTag = `
  <script id="dropdownScript">
    document.addEventListener('DOMContentLoaded', () => {
      const btn = document.querySelector('.nav__dropdown-btn');
      const dropdown = document.querySelector('.nav__dropdown');
      if(btn && dropdown) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          dropdown.classList.toggle('nav__dropdown--open');
        });
        document.addEventListener('click', (e) => {
          if(!dropdown.contains(e.target)) {
            dropdown.classList.remove('nav__dropdown--open');
          }
        });
      }
    });
  </script>`;

dirs.forEach(dir => {
  const htmlPath = path.join(__dirname, dir, 'index.html');
  if (fs.existsSync(htmlPath)) {
    let html = fs.readFileSync(htmlPath, 'utf8');
    if (html.includes('nav__dropdown-btn') && !html.includes('dropdownScript')) {
      html = html.replace('</nav>', '</nav>\n' + scriptTag);
      fs.writeFileSync(htmlPath, html, 'utf8');
      console.log(`Injected script into ${dir}`);
    }
  }
});
