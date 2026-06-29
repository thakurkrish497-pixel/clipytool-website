import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const state = {
  videoFile: null,
  videoURL: null,
  ffmpeg: null,
  ffmpegLoaded: false,
  isProcessing: false,
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

  btnExport:     document.getElementById('btnExport'),
  exportNote:    document.getElementById('exportNote'),
  exportBtnText: document.getElementById('exportBtnText'),
  exportFill:    document.getElementById('exportFill'),
};

function init() {
  setupVideoUpload();
  setupVideoControls();
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
  dom.videoPlayer.load();
  dom.videoPlayer.onerror = () => {
    if(dom.fileNameVid) dom.fileNameVid.textContent = file.name;
    if(dom.fileDetailsVid) dom.fileDetailsVid.textContent = 'Preview unavailable for this format';
    if(dom.dropzoneVid) dom.dropzoneVid.style.display = 'none';
    if(dom.fileInfoVid) dom.fileInfoVid.style.display = 'flex';
    if(dom.videoEmpty) dom.videoEmpty.style.display = 'none';
    dom.videoPlayer.style.display = 'none';
    if(dom.videoControls) dom.videoControls.style.display = 'none';
    if(typeof updateExportState === 'function') updateExportState();
    if(typeof preloadFFmpeg === 'function') preloadFFmpeg();
  };
  dom.videoPlayer.onloadedmetadata = () => {
    dom.fileNameVid.textContent = file.name;
    dom.fileDetailsVid.textContent = `${(file.size / 1024 / 1024).toFixed(1)} MB`;

    dom.dropzoneVid.style.display = 'none';
    dom.fileInfoVid.style.display = 'flex';
    dom.videoEmpty.style.display = 'none';
    dom.videoPlayer.style.display = 'block';
    dom.videoControls.style.display = 'flex';

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

function updateExportState() {
  dom.btnExport.disabled = !state.videoFile || state.isProcessing;
  dom.exportNote.textContent = state.videoFile ? 'Ready to export' : 'Upload a video to get started';
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
  } catch (err) { console.error('FFmpeg load error:', err); alert(Load Error: );
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
      dom.exportBtnText.textContent = `Muting... ${p}%${etaStr}`;
    });

    const ext = state.videoFile.name.split('.').pop().toLowerCase() || 'mp4';
    const inputName = `input.${ext}`;
    const outName = `output.${ext}`;
    
    dom.exportBtnText.textContent = 'Reading file...';
    await ffmpeg.writeFile(inputName, await fetchFile(state.videoFile));

    dom.exportBtnText.textContent = 'Removing audio...';
    
    await ffmpeg.exec([
      -threads,
      '-i', inputName,
      '-c:v', 'copy',
      '-an',
      outName
    ]);

    dom.exportBtnText.textContent = 'Saving...';
    const data = await ffmpeg.readFile(outName);
    const mime = state.videoFile.type || 'video/mp4';
    const blob = new Blob([data.buffer], { type: mime });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    const baseName = state.videoFile.name.replace(/\.[^/.]+$/, '');
    a.download = `${baseName}_muted.${ext}`;
    a.click();

    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outName);

    dom.exportBtnText.textContent = 'Done ✓';
    dom.exportFill.style.width = '100%';
    dom.exportFill.style.background = 'rgba(16, 185, 129, 0.2)'; // Green success

    setTimeout(() => {
      dom.exportBtnText.textContent = 'Mute Video';
      dom.exportFill.style.width = '0%';
      dom.exportFill.style.background = '';
      dom.exportFill.classList.remove('active');
      state.isProcessing = false;
      updateExportState();
    }, 3000);

  } catch (err) { console.error(err); alert(Error: );
    dom.exportBtnText.textContent = 'Error - try again';
    dom.exportFill.classList.remove('active');
    state.isProcessing = false;
    setTimeout(() => { dom.exportBtnText.textContent = 'Mute Video'; updateExportState(); }, 3000);
  }
}

init();
