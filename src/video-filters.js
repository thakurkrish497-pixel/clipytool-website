import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const state = {
  videoFile: null,
  videoURL: null,
  ffmpeg: null,
  ffmpegLoaded: false,
  isProcessing: false,
  preset: 'none',
  brightness: 0,
  contrast: 0,
  saturation: 0,
  blur: 0
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

  presetBtns:    document.querySelectorAll('.btn-filter'),
  btnReset:      document.getElementById('btnReset'),
  
  adjBrightness: document.getElementById('adjBrightness'),
  adjContrast:   document.getElementById('adjContrast'),
  adjSaturation: document.getElementById('adjSaturation'),
  adjBlur:       document.getElementById('adjBlur'),
  
  valBrightness: document.getElementById('valBrightness'),
  valContrast:   document.getElementById('valContrast'),
  valSaturation: document.getElementById('valSaturation'),
  valBlur:       document.getElementById('valBlur'),

  btnExport:     document.getElementById('btnExport'),
  exportNote:    document.getElementById('exportNote'),
  exportBtnText: document.getElementById('exportBtnText'),
  exportFill:    document.getElementById('exportFill'),
};

function init() {
  setupVideoUpload();
  setupVideoControls();
  setupFilters();
  setupExport();
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
    dom.fileNameVid.textContent = file.name;
    dom.fileDetailsVid.textContent = `${(file.size / 1024 / 1024).toFixed(1)} MB`;

    dom.dropzoneVid.style.display = 'none';
    dom.fileInfoVid.style.display = 'flex';
    dom.videoEmpty.style.display = 'none';
    dom.videoPlayer.style.display = 'block';
    dom.videoControls.style.display = 'flex';

    resetFilters();
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

function setupFilters() {
  dom.presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      dom.presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.preset = btn.dataset.filter;
      applyPreview();
    });
  });

  const attachSlider = (inputElem, valElem, stateKey) => {
    inputElem.addEventListener('input', (e) => {
      const v = parseInt(e.target.value);
      state[stateKey] = v;
      valElem.textContent = v;
      applyPreview();
    });
  };

  attachSlider(dom.adjBrightness, dom.valBrightness, 'brightness');
  attachSlider(dom.adjContrast, dom.valContrast, 'contrast');
  attachSlider(dom.adjSaturation, dom.valSaturation, 'saturation');
  attachSlider(dom.adjBlur, dom.valBlur, 'blur');

  dom.btnReset.addEventListener('click', resetFilters);
}

function resetFilters() {
  state.preset = 'none';
  state.brightness = 0;
  state.contrast = 0;
  state.saturation = 0;
  state.blur = 0;

  dom.presetBtns.forEach(b => b.classList.toggle('active', b.dataset.filter === 'none'));
  
  dom.adjBrightness.value = 0; dom.valBrightness.textContent = 0;
  dom.adjContrast.value = 0;   dom.valContrast.textContent = 0;
  dom.adjSaturation.value = 0; dom.valSaturation.textContent = 0;
  dom.adjBlur.value = 0;       dom.valBlur.textContent = 0;

  applyPreview();
}

function applyPreview() {
  let cssFilters = [];

  // Presets
  if (state.preset === 'grayscale') cssFilters.push('grayscale(1)');
  else if (state.preset === 'sepia') cssFilters.push('sepia(1)');
  else if (state.preset === 'invert') cssFilters.push('invert(1)');

  // Adjustments
  if (state.brightness !== 0) cssFilters.push(`brightness(${1 + (state.brightness / 100)})`);
  if (state.contrast !== 0) cssFilters.push(`contrast(${1 + (state.contrast / 100)})`);
  if (state.saturation !== 0) cssFilters.push(`saturate(${1 + (state.saturation / 100)})`);
  if (state.blur > 0) cssFilters.push(`blur(${state.blur}px)`);

  dom.videoPlayer.style.filter = cssFilters.length > 0 ? cssFilters.join(' ') : 'none';
}

function updateExportState() {
  dom.btnExport.disabled = !state.videoFile || state.isProcessing;
  dom.exportNote.textContent = state.videoFile ? 'Ready to export' : 'Upload a video to get started';
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

function setupExport() {
  dom.btnExport.addEventListener('click', processVideo);
}

async function processVideo() {
  if (!state.videoFile || state.isProcessing) return;
  
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
    const outName = `output.mp4`;
    
    dom.exportBtnText.textContent = 'Reading file...';
    await ffmpeg.writeFile(inputName, await fetchFile(state.videoFile));

    // Construct VF chain
    let vf = [];

    // Presets
    if (state.preset === 'grayscale') vf.push('hue=s=0');
    else if (state.preset === 'sepia') vf.push('colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131');
    else if (state.preset === 'invert') vf.push('negate');

    // Adjustments
    if (state.brightness !== 0 || state.contrast !== 0 || state.saturation !== 0) {
      // FFmpeg eq: brightness [-1.0, 1.0], contrast [-1000, 1000] (default 1), saturation [0, 3] (default 1)
      const b = state.brightness / 100;
      const c = 1 + (state.contrast / 100);
      const s = 1 + (state.saturation / 100);
      vf.push(`eq=brightness=${b}:contrast=${c}:saturation=${s}`);
    }

    if (state.blur > 0) {
      vf.push(`boxblur=${state.blur}:1`);
    }

    dom.exportBtnText.textContent = 'Applying filters...';
    
    let args = ['-i', inputName];
    if (vf.length > 0) {
      args.push('-vf', vf.join(','));
      args.push('-c:v', 'libx264', '-threads', '4', '-preset', 'ultrafast');
      args.push('-c:a', 'copy');
    } else {
      // If nothing selected, just copy
      args.push('-c:v', 'copy', '-c:a', 'copy');
    }
    args.push(outName);

    await ffmpeg.exec(args);

    dom.exportBtnText.textContent = 'Saving...';
    const data = await ffmpeg.readFile(outName);
    const blob = new Blob([data.buffer], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    const baseName = state.videoFile.name.replace(/\.[^/.]+$/, '');
    a.download = `${baseName}_filtered.mp4`;
    a.click();

    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outName);

    dom.exportBtnText.textContent = 'Done ✓';
    dom.exportFill.style.width = '100%';
    dom.exportFill.style.background = 'rgba(239, 68, 68, 0.2)';

    setTimeout(() => {
      dom.exportBtnText.textContent = 'Apply Filters';
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
    setTimeout(() => { dom.exportBtnText.textContent = 'Apply Filters'; updateExportState(); }, 3000);
  }
}

init();
