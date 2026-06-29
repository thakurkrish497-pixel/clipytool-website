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

  vidSpeed:      document.getElementById('vidSpeed'),
  vidAudio:      document.getElementById('vidAudio'),
  
  btnExport:     document.getElementById('btnExport'),
  exportNote:    document.getElementById('exportNote'),
  exportBtnText: document.getElementById('exportBtnText'),
  exportFill:    document.getElementById('exportFill'),
};

function init() {
  setupVideoUpload();
  setupVideoControls();
  setupSettings();
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
    dom.fileDetailsVid.textContent = `${dom.videoPlayer.videoWidth}×${dom.videoPlayer.videoHeight} · ${(file.size / 1024 / 1024).toFixed(1)} MB`;

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

function setupSettings() {
  dom.vidSpeed.addEventListener('change', () => {
    dom.videoPlayer.playbackRate = parseFloat(dom.vidSpeed.value);
  });
}

function fmtTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

function updateExportState() {
  dom.btnExport.disabled = !state.videoFile || state.isProcessing;
  dom.exportNote.textContent = state.videoFile ? 'Ready to change speed' : 'Upload a video to get started';
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
  dom.btnExport.addEventListener('click', processSpeed);
}

async function processSpeed() {
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
      dom.exportBtnText.textContent = `Processing... ${p}%${etaStr}`;
    });

    const ext = state.videoFile.name.split('.').pop().toLowerCase() || 'mp4';
    const inputName = `input.${ext}`;
    const outputName = `output.${ext}`;

    await ffmpeg.writeFile(inputName, await fetchFile(state.videoFile));

    const speed = parseFloat(dom.vidSpeed.value) || 1;
    const pts = 1 / speed;
    const mute = dom.vidAudio.value === 'mute';

    let args = [
      '-i', inputName,
      '-filter:v', `setpts=${pts}*PTS`,
    ];

    if (mute) {
      args.push('-an');
    } else {
      // Calculate atempo chain (atempo is limited to 0.5 to 2.0)
      let atempo = '';
      if (speed === 0.25) atempo = 'atempo=0.5,atempo=0.5';
      else if (speed === 4) atempo = 'atempo=2.0,atempo=2.0';
      else atempo = `atempo=${speed}`;
      args.push('-filter:a', atempo);
    }
    
    args.push('-c:v', 'libx264', '-preset', 'ultrafast', -threads, outputName);

    dom.exportBtnText.textContent = 'Changing Speed...';

    await ffmpeg.exec(args);
    dom.exportFill.style.width = '100%';
    dom.exportBtnText.textContent = 'Processing... 100%';

    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data.buffer], { type: state.videoFile.type || 'video/mp4' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = state.videoFile.name.replace(/\.[^/.]+$/, '') + `_${speed}x.` + ext;
    a.click();

    dom.exportBtnText.textContent = 'Done ✓';
    dom.exportFill.style.width = '100%';
    dom.exportFill.style.background = 'rgba(99, 102, 241, 0.2)';

    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    setTimeout(() => {
      dom.exportBtnText.textContent = 'Change Speed';
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
    setTimeout(() => { dom.exportBtnText.textContent = 'Change Speed'; updateExportState(); }, 3000);
  }
}

init();
