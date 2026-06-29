const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'compress-video.js');
let content = fs.readFileSync(filePath, 'utf8');

// Replace DOM elements
content = content.replace(
  /resizeW:.*?,[\s\S]*?presets:.*?,/,
  `compressQuality: document.getElementById('compressQuality'),
  qualityValue: document.getElementById('qualityValue'),`
);

// Replace setupResizeControls call
content = content.replace('setupResizeControls();', 'setupCompressControls();');

// Replace the setupResizeControls and clearPresets functions
const setupCompressControlsFn = `
function setupCompressControls() {
  if (dom.compressQuality && dom.qualityValue) {
    dom.compressQuality.addEventListener('input', (e) => {
      dom.qualityValue.textContent = e.target.value;
    });
  }
}
`;
content = content.replace(/function setupResizeControls\(\) \{[\s\S]*?function clearPresets\(\) \{[\s\S]*?\}/, setupCompressControlsFn.trim());

// Remove originalW, originalH, etc from loadVideo if needed, but they are harmless.
content = content.replace('dom.resizeW.value = state.originalW;', '');
content = content.replace('dom.resizeH.value = state.originalH;', '');

// Replace setupExport
content = content.replace('dom.btnExport.addEventListener(\'click\', processResize);', 'dom.btnExport.addEventListener(\'click\', processCompress);');

// Replace processResize
const processCompressFn = `
async function processCompress() {
  if (!state.videoFile || state.isProcessing) return;
  
  const crf = dom.compressQuality ? dom.compressQuality.value : '28';

  state.isProcessing = true;
  updateExportState();
  dom.exportFill.style.width = '0%';
  dom.exportFill.classList.add('active');

  try {
    if (!state.ffmpegLoaded) {
      dom.exportBtnText.textContent = 'Downloading Engine (~30s)...';
      await preloadFFmpeg();
      dom.exportBtnText.textContent = 'Preparing File...';
    }
    const ffmpeg = state.ffmpeg;

    ffmpeg.on('progress', ({ progress }) => {
      const p = Math.min(Math.round(progress * 100), 100);
      dom.exportFill.style.width = p + '%';
      dom.exportBtnText.textContent = \`Processing... \${p}%\`;
    });

    const ext = state.videoFile.name.split('.').pop().toLowerCase() || 'mp4';
    const inputName = \`input.\${ext}\`;
    const outName = \`output.mp4\`; 
    
    dom.exportBtnText.textContent = 'Reading file...';
    await ffmpeg.writeFile(inputName, await fetchFile(state.videoFile));

    dom.exportBtnText.textContent = 'Compressing video...';
    
    await ffmpeg.exec([
      '-i', inputName,
      '-vcodec', 'libx264',
      '-crf', crf,
      '-preset', 'ultrafast',
      '-c:a', 'copy',
      outName
    ]);
`;
content = content.replace(/async function processResize\(\) \{[\s\S]*?\]\);/, processCompressFn.trim());

// Replace btn-export.done styles if any, or just renaming the success text
content = content.replace("exportBtnText.textContent = 'Resize Video'", "exportBtnText.textContent = 'Compress Video'");
content = content.replace("exportBtnText.textContent = 'Download Resized Video'", "exportBtnText.textContent = 'Download Compressed Video'");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Modified src/compress-video.js');
