import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const state = {
  images: [], // array of { file, url }
  ffmpeg: null,
  ffmpegLoaded: false,
  isProcessing: false,
};

const dom = {
  dropzoneImg:   document.getElementById('dropzoneImg'),
  fileInputImg:  document.getElementById('fileInputImg'),
  imageSequence: document.getElementById('imageSequence'),
  sequenceActions: document.getElementById('sequenceActions'),
  imageCount:    document.getElementById('imageCount'),
  btnClear:      document.getElementById('btnClear'),
  
  gifDelay:      document.getElementById('gifDelay'),
  gifWidth:      document.getElementById('gifWidth'),

  btnExport:     document.getElementById('btnExport'),
  exportNote:    document.getElementById('exportNote'),
  exportBtnText: document.getElementById('exportBtnText'),
  exportFill:    document.getElementById('exportFill'),
};

function init() {
  setupUpload();
  setupControls();
}

function setupUpload() {
  dom.dropzoneImg.addEventListener('click', () => dom.fileInputImg.click());
  dom.fileInputImg.addEventListener('change', (e) => handleFiles(e.target.files));

  dom.dropzoneImg.addEventListener('dragover', (e) => { e.preventDefault(); dom.dropzoneImg.classList.add('dragover'); });
  dom.dropzoneImg.addEventListener('dragleave', () => dom.dropzoneImg.classList.remove('dragover'));
  dom.dropzoneImg.addEventListener('drop', (e) => {
    e.preventDefault();
    dom.dropzoneImg.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  });
}

function handleFiles(fileList) {
  const newFiles = Array.from(fileList).filter(f => f.type.startsWith('image/'));
  if (newFiles.length === 0) return;

  newFiles.forEach(file => {
    state.images.push({ file, url: URL.createObjectURL(file) });
  });

  renderSequence();
  preloadFFmpeg();
}

function renderSequence() {
  dom.imageSequence.innerHTML = '';
  
  if (state.images.length === 0) {
    dom.dropzoneImg.style.display = 'flex';
    dom.sequenceActions.style.display = 'none';
  } else {
    dom.dropzoneImg.style.display = 'none';
    dom.sequenceActions.style.display = 'flex';
    
    state.images.forEach((imgObj, i) => {
      const el = document.createElement('div');
      el.className = 'gm-thumb';
      el.innerHTML = `
        <span class="gm-thumb__num">${i + 1}</span>
        <img src="${imgObj.url}" alt="Frame ${i+1}" />
        <button class="gm-thumb__remove" data-index="${i}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      `;
      dom.imageSequence.appendChild(el);
    });

    // Add a small '+' dropzone at the end to add more
    const addMore = document.createElement('div');
    addMore.className = 'gm-thumb';
    addMore.style.display = 'flex';
    addMore.style.alignItems = 'center';
    addMore.style.justifyContent = 'center';
    addMore.style.cursor = 'pointer';
    addMore.style.border = '1px dashed rgba(255,255,255,0.2)';
    addMore.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
    addMore.onclick = () => dom.fileInputImg.click();
    dom.imageSequence.appendChild(addMore);
  }

  dom.imageCount.textContent = `${state.images.length} images selected`;
  updateExportState();
}

function setupControls() {
  dom.imageSequence.addEventListener('click', (e) => {
    const btn = e.target.closest('.gm-thumb__remove');
    if (btn) {
      const idx = parseInt(btn.dataset.index);
      URL.revokeObjectURL(state.images[idx].url);
      state.images.splice(idx, 1);
      renderSequence();
    }
  });

  dom.btnClear.addEventListener('click', () => {
    state.images.forEach(i => URL.revokeObjectURL(i.url));
    state.images = [];
    renderSequence();
  });

  dom.btnExport.addEventListener('click', processGIF);
}

function updateExportState() {
  const ready = state.images.length >= 2;
  dom.btnExport.disabled = !ready || state.isProcessing;
  dom.exportNote.textContent = ready ? 'Ready to make GIF' : 'Upload at least 2 images';
}

async function preloadFFmpeg() {
  if (state.ffmpegLoaded) return;
  try {
    state.ffmpeg = new FFmpeg();
    const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm';
    await state.ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
    });
    state.ffmpegLoaded = true;
  } catch (err) {
    console.error('FFmpeg load error:', err);
  }
}

async function processGIF() {
  if (state.images.length < 2 || state.isProcessing) return;
  state.isProcessing = true;
  updateExportState();
  if (!state.ffmpegLoaded) {
    dom.exportBtnText.textContent = 'Downloading Engine (~30s)...';
  } else {
    dom.exportBtnText.textContent = 'Preparing File...';
  }
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
      dom.exportBtnText.textContent = `Processing... ${p}%`;
    });

    if (!state.ffmpegLoaded) {
    dom.exportBtnText.textContent = 'Downloading Engine (~30s)...';
  } else {
    dom.exportBtnText.textContent = 'Preparing File...';
  }
    
    // Write all images sequentially: img001.jpg, img002.jpg
    for (let i = 0; i < state.images.length; i++) {
      const num = String(i + 1).padStart(3, '0');
      const ext = state.images[i].file.name.split('.').pop().toLowerCase();
      // Even if it's png/webp, we can just use a generic extension or read it exactly.
      await ffmpeg.writeFile(`img${num}.png`, await fetchFile(state.images[i].file));
    }

    const delayMs = parseInt(dom.gifDelay.value) || 100;
    const fps = 1000 / delayMs;
    const width = parseInt(dom.gifWidth.value) || 600;
    
    const scaleFilter = width === -1 ? '' : `scale=${width}:-1:flags=lanczos,`;
    const filterComplex = `[0:v] ${scaleFilter}split [a][b];[a] palettegen [p];[b][p] paletteuse`;

    dom.exportBtnText.textContent = 'Making GIF...';

    await ffmpeg.exec([
      '-threads', '4',
      '-framerate', fps.toString(),
      '-i', 'img%03d.png',
      '-threads', '4',
      '-filter_complex', filterComplex,
      'output.gif'
    ]);

    const data = await ffmpeg.readFile('output.gif');
    const blob = new Blob([data.buffer], { type: 'image/gif' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'clipy_maker.gif';
    a.click();

    dom.exportBtnText.textContent = 'Done ✓';
    dom.exportFill.style.width = '100%';
    dom.exportFill.style.background = 'rgba(14, 165, 233, 0.2)';

    // Cleanup
    for (let i = 0; i < state.images.length; i++) {
      const num = String(i + 1).padStart(3, '0');
      await ffmpeg.deleteFile(`img${num}.png`).catch(()=>{});
    }
    await ffmpeg.deleteFile('output.gif');

    setTimeout(() => {
      dom.exportBtnText.textContent = 'Make a GIF';
      dom.exportFill.style.width = '0%';
      dom.exportFill.style.background = '';
      dom.exportFill.classList.remove('active');
      state.isProcessing = false;
      updateExportState();
    }, 3000);

  } catch (err) {
    console.error(err);
    dom.exportBtnText.textContent = 'Error - try again';
    dom.exportFill.classList.remove('active');
    state.isProcessing = false;
    setTimeout(() => { dom.exportBtnText.textContent = 'Make a GIF'; updateExportState(); }, 3000);
  }
}

init();
