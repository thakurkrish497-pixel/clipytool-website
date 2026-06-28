import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

// ============================================
// STATE
// ============================================
const state = {
  videoFile: null,
  videoURL: null,
  ffmpeg: null,
  ffmpegLoaded: false,
  isProcessing: false,
};

const dom = {
  videoStage:    document.getElementById('videoStage'),
  videoEmpty:    document.getElementById('videoEmpty'),
  videoPlayer:   document.getElementById('videoPlayer'),
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

  trimStart:     document.getElementById('trimStart'),
  trimEnd:       document.getElementById('trimEnd'),
  btnUseCurrentStart: document.getElementById('btnUseCurrentStart'),
  btnUseCurrentEnd:   document.getElementById('btnUseCurrentEnd'),
  
  gifWidth:      document.getElementById('gifWidth'),
  gifFps:        document.getElementById('gifFps'),

  btnExport:     document.getElementById('btnExport'),
  exportNote:    document.getElementById('exportNote'),
  exportBtnText: document.getElementById('exportBtnText'),
  exportFill:    document.getElementById('exportFill'),
};


function init() {
  setupVideoUpload();
  setupVideoControls();
  setupTrimControls();
  setupExport();
}

// ============================================
// UPLOAD
// ============================================
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
    dom.fileDetailsVid.textContent = `${dom.videoPlayer.videoWidth}×${dom.videoPlayer.videoHeight} · ${(file.size / 1024 / 1024).toFixed(1)} MB`;

    dom.dropzoneVid.style.display = 'none';
    dom.fileInfoVid.style.display = 'flex';
    dom.videoEmpty.style.display = 'none';
    dom.videoPlayer.style.display = 'block';
    dom.videoControls.style.display = 'flex';

    dom.trimStart.value = "0";
    dom.trimEnd.value = dom.videoPlayer.duration.toFixed(1);

    updateExportState();
    preloadFFmpeg();
  };
}

// ============================================
// VIDEO CONTROLS & TRIM
// ============================================
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

  dom.seekBar.addEventListener('input', (e) => {
    vid.currentTime = (e.target.value / 1000) * vid.duration;
  });
}

function fmtTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

function setupTrimControls() {
  dom.btnUseCurrentStart.addEventListener('click', () => {
    dom.trimStart.value = dom.videoPlayer.currentTime.toFixed(1);
  });
  dom.btnUseCurrentEnd.addEventListener('click', () => {
    dom.trimEnd.value = dom.videoPlayer.currentTime.toFixed(1);
  });
}


// ============================================
// EXPORT & FFMPEG
// ============================================
function updateExportState() {
  dom.btnExport.disabled = !state.videoFile || state.isProcessing;
  dom.exportNote.textContent = state.videoFile ? 'Ready to convert to GIF' : 'Upload a video to get started';
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
  dom.btnExport.addEventListener('click', processGIF);
}

async function processGIF() {
  if (!state.videoFile || state.isProcessing) return;
  state.isProcessing = true;
  dom.btnExport.disabled = true;
  dom.exportBtnText.textContent = 'Loading FFmpeg...';
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

    dom.exportBtnText.textContent = 'Preparing file...';
    await ffmpeg.writeFile('input.mp4', await fetchFile(state.videoFile));

    const tStart = parseFloat(dom.trimStart.value) || 0;
    const tEnd = parseFloat(dom.trimEnd.value) || dom.videoPlayer.duration;
    const duration = Math.max(0, tEnd - tStart);
    
    const fps = parseInt(dom.gifFps.value) || 10;
    const width = parseInt(dom.gifWidth.value) || 600;
    
    // We use a complex filter to generate a high quality palette and then map it
    const scaleFilter = width === -1 ? '' : `scale=${width}:-1:flags=lanczos,`;
    const filterComplex = `[0:v] fps=${fps},${scaleFilter}split [a][b];[a] palettegen [p];[b][p] paletteuse`;

    dom.exportBtnText.textContent = 'Converting... 0%';

    await ffmpeg.exec([
      '-threads', '4',
      '-ss', tStart.toString(),
      '-t', duration.toString(),
      '-i', 'input.mp4',
      '-filter_complex', filterComplex,
      'output.gif'
    ]);

    const data = await ffmpeg.readFile('output.gif');
    const blob = new Blob([data.buffer], { type: 'image/gif' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = state.videoFile.name.replace(/\.[^/.]+$/, '') + '.gif';
    a.click();

    dom.exportBtnText.textContent = 'Done ✓';
    dom.exportFill.style.width = '100%';
    dom.exportFill.style.background = 'rgba(52, 211, 153, 0.2)';

    await ffmpeg.deleteFile('input.mp4');
    await ffmpeg.deleteFile('output.gif');

    setTimeout(() => {
      dom.exportBtnText.textContent = 'Convert to GIF';
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
    setTimeout(() => { dom.exportBtnText.textContent = 'Convert to GIF'; updateExportState(); }, 3000);
  }
}

init();
