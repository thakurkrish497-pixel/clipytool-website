import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const state = {
  videoFile: null,
  ffmpeg: null,
  ffmpegLoaded: false,
  isProcessing: false,
};

const dom = {
  dropzoneVid:   document.getElementById('dropzoneVid'),
  fileInputVid:  document.getElementById('fileInputVid'),
  fileInfoVid:   document.getElementById('fileInfoVid'),
  fileNameVid:   document.getElementById('fileNameVid'),
  fileDetailsVid:document.getElementById('fileDetailsVid'),
  btnChangeVid:  document.getElementById('btnChangeVid'),

  mp4Preset:     document.getElementById('mp4Preset'),
  mp4Audio:      document.getElementById('mp4Audio'),
  
  btnExport:     document.getElementById('btnExport'),
  exportNote:    document.getElementById('exportNote'),
  exportBtnText: document.getElementById('exportBtnText'),
  exportFill:    document.getElementById('exportFill'),
};

function init() {
  setupUpload();
  setupExport();
}

function setupUpload() {
  dom.dropzoneVid.addEventListener('click', () => dom.fileInputVid.click());
  dom.btnChangeVid.addEventListener('click', () => dom.fileInputVid.click());
  dom.fileInputVid.addEventListener('change', (e) => {
    if (e.target.files[0]) loadVideo(e.target.files[0]);
  });
  dom.dropzoneVid.addEventListener('dragover', (e) => { e.preventDefault(); dom.dropzoneVid.classList.add('dragover'); });
  dom.dropzoneVid.addEventListener('dragleave', () => dom.dropzoneVid.classList.remove('dragover'));
  dom.dropzoneVid.addEventListener('drop', (e) => {
    e.preventDefault();
    dom.dropzoneVid.classList.remove('dragover');
    if (e.dataTransfer.files[0]) {
      loadVideo(e.dataTransfer.files[0]);
    }
  });
}

function loadVideo(file) {
  state.videoFile = file;
  dom.fileNameVid.textContent = file.name;
  dom.fileDetailsVid.textContent = `${(file.size / 1024 / 1024).toFixed(1)} MB`;

  dom.dropzoneVid.style.display = 'none';
  dom.fileInfoVid.style.display = 'flex';

  updateExportState();
  preloadFFmpeg();
}

function updateExportState() {
  dom.btnExport.disabled = !state.videoFile || state.isProcessing;
  dom.exportNote.textContent = state.videoFile ? 'Ready to convert to MP4' : 'Upload a video to get started';
}

async function preloadFFmpeg() {
  if (state.ffmpegLoaded) return;
  try {
    state.ffmpeg = new FFmpeg();
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    const coreName = isMobile ? 'core' : 'core-mt';
    const baseURL = `https://unpkg.com/@ffmpeg/${coreName}@0.12.6/dist/esm`;
    const loadOpts = {
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    };
    if (!isMobile) {
      loadOpts.workerURL = await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript');
    }
    await state.ffmpeg.load(loadOpts);
    state.ffmpegLoaded = true;
  } catch (err) { console.error('FFmpeg load error:', err); alert("Load Error: " + (err.message || err));
  }
}

function setupExport() {
  dom.btnExport.addEventListener('click', processConversion);
}

async function processConversion() {
  if (!state.videoFile || state.isProcessing) return;
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

    let processStartTime = Date.now();
    ffmpeg.on('progress', ({ progress }) => {
      const p = Math.min(Math.round(progress * 100), 100);
      dom.exportFill.style.width = p + '%';
      
      let etaStr = '';
      if (progress > 0.01 && progress < 1) {
          const elapsed = (Date.now() - processStartTime) / 1000;
          const totalEstimated = elapsed / progress;
          const remaining = totalEstimated - elapsed;
          if (remaining > 0 && remaining < 7200) { // cap at 2 hours for sanity
              const mins = Math.floor(remaining / 60);
              const secs = Math.floor(remaining % 60);
              etaStr = ` (ETA: ${mins > 0 ? mins + 'm ' : ''}${secs}s)`;
          }
      }
      dom.exportBtnText.textContent = `Converting... ${p}%${etaStr}`;
    });

    const ext = state.videoFile.name.split('.').pop().toLowerCase() || 'mov';
    const inputName = `input.${ext}`;
    const outputName = 'output.mp4';

    dom.exportBtnText.textContent = 'Reading file...';
    await ffmpeg.writeFile(inputName, await fetchFile(state.videoFile));

    const preset = dom.mp4Preset.value;
    const audio = dom.mp4Audio.value === 'none' ? ['-an'] : ['-c:a', 'aac'];

    dom.exportBtnText.textContent = 'Converting...';

    await ffmpeg.exec([
      '-i', inputName,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-preset', preset,
      '-threads', /Mobi|Android/i.test(navigator.userAgent) ? '1' : '4',
      ...audio,
      outputName
    ]);

    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data.buffer], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = state.videoFile.name.replace(/\.[^/.]+$/, '') + '_converted.mp4';
    a.click();

    dom.exportBtnText.textContent = 'Done ✓';
    dom.exportFill.style.width = '100%';
    dom.exportFill.style.background = 'rgba(16, 185, 129, 0.2)';

    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    setTimeout(() => {
      dom.exportBtnText.textContent = 'Convert to MP4';
      dom.exportFill.style.width = '0%';
      dom.exportFill.style.background = '';
      dom.exportFill.classList.remove('active');
      state.isProcessing = false;
      updateExportState();
    }, 3000);

  } catch (err) { console.error(err); alert("Error: " + (err.message || err));
    dom.exportBtnText.textContent = 'Error - try again';
    dom.exportFill.classList.remove('active');
    state.isProcessing = false;
    setTimeout(() => { dom.exportBtnText.textContent = 'Convert to MP4'; updateExportState(); }, 3000);
  }
}

init();
