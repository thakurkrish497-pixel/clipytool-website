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

  trimControls:  document.getElementById('trimControls'),
  trimStart:     document.getElementById('trimStart'),
  trimEnd:       document.getElementById('trimEnd'),
  btnUseCurrentStart: document.getElementById('btnUseCurrentStart'),
  btnUseCurrentEnd:   document.getElementById('btnUseCurrentEnd'),

  v2iMode:       document.getElementById('v2iMode'),
  rowFps:        document.getElementById('rowFps'),
  v2iFps:        document.getElementById('v2iFps'),
  v2iFormat:     document.getElementById('v2iFormat'),
  
  btnExport:     document.getElementById('btnExport'),
  exportNote:    document.getElementById('exportNote'),
  exportBtnText: document.getElementById('exportBtnText'),
  exportFill:    document.getElementById('exportFill'),
};

function init() {
  setupVideoUpload();
  setupVideoControls();
  setupTrimControls();
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

    dom.trimStart.value = "0";
    dom.trimEnd.value = dom.videoPlayer.duration.toFixed(1);

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

function setupTrimControls() {
  dom.btnUseCurrentStart.addEventListener('click', () => dom.trimStart.value = dom.videoPlayer.currentTime.toFixed(1));
  dom.btnUseCurrentEnd.addEventListener('click', () => dom.trimEnd.value = dom.videoPlayer.currentTime.toFixed(1));
}

function setupSettings() {
  dom.v2iMode.addEventListener('change', () => {
    const isSeq = dom.v2iMode.value === 'sequence';
    dom.trimControls.style.display = isSeq ? 'flex' : 'none';
    dom.rowFps.style.display = isSeq ? 'flex' : 'none';
    dom.exportBtnText.textContent = isSeq ? 'Extract Zip' : 'Extract Image';
  });
}

function fmtTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

function updateExportState() {
  dom.btnExport.disabled = !state.videoFile || state.isProcessing;
  dom.exportNote.textContent = state.videoFile ? 'Ready to extract' : 'Upload a video to get started';
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
  } catch (err) {
    console.error('FFmpeg load error:', err);
  }
}

function setupExport() {
  dom.btnExport.addEventListener('click', processExtract);
}

async function processExtract() {
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
      dom.exportBtnText.textContent = `Processing... ${p}%${etaStr}`;
    });

    const ext = state.videoFile.name.split('.').pop().toLowerCase() || 'mp4';
    const inputName = `input.${ext}`;
    
    dom.exportBtnText.textContent = 'Reading file...';
    await ffmpeg.writeFile(inputName, await fetchFile(state.videoFile));

    const mode = dom.v2iMode.value;
    const format = dom.v2iFormat.value; // jpg or png
    const baseName = state.videoFile.name.replace(/\.[^/.]+$/, '');

    if (mode === 'single') {
      const t = dom.videoPlayer.currentTime.toFixed(3);
      const outName = `out.${format}`;
      
      dom.exportBtnText.textContent = 'Extracting frame...';
      
      await ffmpeg.exec([
      -threads,
      -threads,
        '-i', inputName,
        '-ss', t,
        '-vframes', '1',
        '-q:v', '2',
        outName
      ]);

      const data = await ffmpeg.readFile(outName);
      const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
      const blob = new Blob([data.buffer], { type: mimeType });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${baseName}_frame.${format}`;
      a.click();

      await ffmpeg.deleteFile(outName);

    } else {
      // Sequence Mode
      const fps = dom.v2iFps.value;
      const tStart = parseFloat(dom.trimStart.value) || 0;
      const tEnd = parseFloat(dom.trimEnd.value) || dom.videoPlayer.duration;
      const duration = Math.max(0, tEnd - tStart);
      
      dom.exportBtnText.textContent = 'Extracting sequence...';

      // Use a glob output like img_0001.jpg
      const outPattern = `img_%04d.${format}`;

      await ffmpeg.exec([
      -threads,
      -threads,
        '-ss', tStart.toString(),
        '-t', duration.toString(),
        '-i', inputName,
        '-r', fps,
        '-q:v', '2',
        outPattern
      ]);

      dom.exportBtnText.textContent = 'Zipping files...';

      // Find generated files
      const dirList = await ffmpeg.listDir('/');
      const imgFiles = dirList.filter(f => f.name.startsWith('img_') && f.name.endsWith(`.${format}`));

      if (imgFiles.length > 0 && typeof JSZip !== 'undefined') {
        const zip = new JSZip();
        for (const file of imgFiles) {
          const data = await ffmpeg.readFile(file.name);
          zip.file(file.name, data.buffer);
          await ffmpeg.deleteFile(file.name);
        }
        
        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${baseName}_sequence.zip`;
        a.click();
      }
    }

    await ffmpeg.deleteFile(inputName);

    dom.exportBtnText.textContent = 'Done ✓';
    dom.exportFill.style.width = '100%';
    dom.exportFill.style.background = 'rgba(239, 68, 68, 0.2)';

    setTimeout(() => {
      dom.exportBtnText.textContent = mode === 'sequence' ? 'Extract Zip' : 'Extract Image';
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
    setTimeout(() => { dom.exportBtnText.textContent = dom.v2iMode.value === 'sequence' ? 'Extract Zip' : 'Extract Image'; updateExportState(); }, 3000);
  }
}

init();
