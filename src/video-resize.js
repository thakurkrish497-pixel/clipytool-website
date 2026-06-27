import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const state = {
  videoFile: null,
  videoURL: null,
  ffmpeg: null,
  ffmpegLoaded: false,
  isProcessing: false,
  originalW: 0,
  originalH: 0,
  aspectRatio: 1,
  linked: true,
};

const dom = {
  videoPlayer:   document.getElementById('videoPlayer'),
  videoEmpty:    document.getElementById('videoEmpty'),
  videoControls: document.getElementById('videoControls'),
  btnPlayPause:  document.getElementById('btnPlayPause'),
  iconPlay:      document.getElementById('iconPlay'),
  iconPause:     document.getElementById('iconPause'),
  seekBar:       document.getElementById('seekBar'),
  seekFill:      document.getElementById('seekFill'),
  timeDisplay:   document.getElementById('timeDisplay'),

  dropzoneVid:   document.getElementById('dropzoneVid'),
  fileInputVid:  document.getElementById('fileInputVid'),
  fileInfoVid:   document.getElementById('fileInfoVid'),
  fileNameVid:   document.getElementById('fileNameVid'),
  fileDetailsVid:document.getElementById('fileDetailsVid'),
  btnChangeVid:  document.getElementById('btnChangeVid'),

  resizeW:       document.getElementById('resizeW'),
  resizeH:       document.getElementById('resizeH'),
  btnLink:       document.getElementById('btnLink'),
  presets:       document.querySelectorAll('.btn-preset'),

  btnExport:     document.getElementById('btnExport'),
  exportNote:    document.getElementById('exportNote'),
  exportBtnText: document.getElementById('exportBtnText'),
  exportFill:    document.getElementById('exportFill'),
};

function init() {
  setupVideoUpload();
  setupVideoControls();
  setupResizeControls();
  setupExport();
  
  // Set initial link state
  dom.btnLink.classList.add('linked');
}

function setupVideoUpload() {
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
    if (e.dataTransfer.files[0] && e.dataTransfer.files[0].type.startsWith('video/')) {
      loadVideo(e.dataTransfer.files[0]);
    }
  });
}

function loadVideo(file) {
  state.videoFile = file;
  if (state.videoURL) URL.revokeObjectURL(state.videoURL);
  state.videoURL = URL.createObjectURL(file);

  dom.videoPlayer.src = state.videoURL;
  dom.videoPlayer.onloadedmetadata = () => {
    state.originalW = dom.videoPlayer.videoWidth;
    state.originalH = dom.videoPlayer.videoHeight;
    state.aspectRatio = state.originalW / state.originalH;

    dom.fileNameVid.textContent = file.name;
    dom.fileDetailsVid.textContent = `${state.originalW}×${state.originalH} · ${(file.size / 1024 / 1024).toFixed(1)} MB`;

    dom.dropzoneVid.style.display = 'none';
    dom.fileInfoVid.style.display = 'flex';
    dom.videoEmpty.style.display = 'none';
    dom.videoPlayer.style.display = 'block';
    dom.videoControls.style.display = 'flex';

    dom.resizeW.value = state.originalW;
    dom.resizeH.value = state.originalH;

    updateExportState();
    preloadFFmpeg();
  };
}

function setupVideoControls() {
  const vid = dom.videoPlayer;
  dom.btnPlayPause.addEventListener('click', () => vid.paused ? vid.play() : vid.pause());
  vid.addEventListener('play', () => { dom.iconPlay.style.display = 'none'; dom.iconPause.style.display = 'block'; });
  vid.addEventListener('pause', () => { dom.iconPlay.style.display = 'block'; dom.iconPause.style.display = 'none'; });

  vid.addEventListener('timeupdate', () => {
    if (!vid.duration) return;
    const pct = (vid.currentTime / vid.duration) * 100;
    dom.seekFill.style.width = pct + '%';
    dom.seekBar.value = (vid.currentTime / vid.duration) * 1000;
    dom.timeDisplay.textContent = `${fmtTime(vid.currentTime)} / ${fmtTime(vid.duration)}`;
  });
  dom.seekBar.addEventListener('input', (e) => vid.currentTime = (e.target.value / 1000) * vid.duration);
}

function fmtTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

function setupResizeControls() {
  dom.btnLink.addEventListener('click', () => {
    state.linked = !state.linked;
    if (state.linked) {
      dom.btnLink.classList.add('linked');
      // Recalculate H based on W instantly
      dom.resizeH.value = Math.round(parseInt(dom.resizeW.value) / state.aspectRatio);
    } else {
      dom.btnLink.classList.remove('linked');
    }
  });

  dom.resizeW.addEventListener('input', (e) => {
    clearPresets();
    if (state.linked && e.target.value) {
      dom.resizeH.value = Math.round(parseInt(e.target.value) / state.aspectRatio);
    }
  });

  dom.resizeH.addEventListener('input', (e) => {
    clearPresets();
    if (state.linked && e.target.value) {
      dom.resizeW.value = Math.round(parseInt(e.target.value) * state.aspectRatio);
    }
  });

  dom.presets.forEach(btn => {
    btn.addEventListener('click', () => {
      clearPresets();
      btn.classList.add('active');
      const scale = parseFloat(btn.dataset.scale);
      
      // Ensure we maintain aspect ratio even if unlinked when clicking presets, 
      // but only update inputs. 
      dom.resizeW.value = Math.round(state.originalW * scale);
      dom.resizeH.value = Math.round(state.originalH * scale);
    });
  });
}

function clearPresets() {
  dom.presets.forEach(b => b.classList.remove('active'));
}

function updateExportState() {
  dom.btnExport.disabled = !state.videoFile || state.isProcessing;
  dom.exportNote.textContent = state.videoFile ? 'Ready to export' : 'Upload a video to get started';
}

async function preloadFFmpeg() {
  if (state.ffmpegLoaded) return;
  try {
    state.ffmpeg = new FFmpeg();
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm';
    await state.ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    state.ffmpegLoaded = true;
  } catch (err) {
    console.error('FFmpeg load error:', err);
  }
}

function setupExport() {
  dom.btnExport.addEventListener('click', processResize);
}

async function processResize() {
  if (!state.videoFile || state.isProcessing) return;
  
  let targetW = parseInt(dom.resizeW.value);
  let targetH = parseInt(dom.resizeH.value);

  // FFmpeg requires dimensions to be strictly even integers for many codecs like libx264
  if (targetW % 2 !== 0) targetW -= 1;
  if (targetH % 2 !== 0) targetH -= 1;

  state.isProcessing = true;
  updateExportState();
  dom.exportFill.style.width = '0%';
  dom.exportFill.classList.add('active');

  try {
    if (!state.ffmpegLoaded) await preloadFFmpeg();
    const ffmpeg = state.ffmpeg;

    ffmpeg.on('progress', ({ progress }) => {
      const p = Math.min(Math.round(progress * 100), 100);
      dom.exportFill.style.width = p + '%';
      dom.exportBtnText.textContent = `Processing... ${p}%`;
    });

    const ext = state.videoFile.name.split('.').pop().toLowerCase() || 'mp4';
    const inputName = `input.${ext}`;
    const outName = `output.mp4`; // standardizing output to mp4 for resizer
    
    dom.exportBtnText.textContent = 'Reading file...';
    await ffmpeg.writeFile(inputName, await fetchFile(state.videoFile));

    dom.exportBtnText.textContent = 'Resizing video...';
    
    // Process the scale filter
    await ffmpeg.exec([
      '-i', inputName,
      '-vf', `scale=${targetW}:${targetH}`,
      '-c:v', 'libx264',
      '-c:a', 'copy',
      outName
    ]);

    dom.exportBtnText.textContent = 'Saving...';
    const data = await ffmpeg.readFile(outName);
    const blob = new Blob([data.buffer], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    const baseName = state.videoFile.name.replace(/\.[^/.]+$/, '');
    a.download = `${baseName}_resized.mp4`;
    a.click();

    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outName);

    dom.exportBtnText.textContent = 'Done ✓';
    dom.exportFill.style.width = '100%';
    dom.exportFill.style.background = 'rgba(239, 68, 68, 0.2)';

    setTimeout(() => {
      dom.exportBtnText.textContent = 'Resize Video';
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
    setTimeout(() => { dom.exportBtnText.textContent = 'Resize Video'; updateExportState(); }, 3000);
  }
}

init();
