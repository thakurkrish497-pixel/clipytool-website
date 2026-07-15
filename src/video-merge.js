import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const state = {
  videos: [], // array of File objects
  maxVideos: 5,
  ffmpeg: null,
  ffmpegLoaded: false,
  isProcessing: false,
};

const dom = {
  dropzoneVid:   document.getElementById('dropzoneVid'),
  fileInputVid:  document.getElementById('fileInputVid'),
  videoList:     document.getElementById('videoList'),

  btnExport:     document.getElementById('btnExport'),
  exportNote:    document.getElementById('exportNote'),
  exportBtnText: document.getElementById('exportBtnText'),
  exportFill:    document.getElementById('exportFill'),
};

function init() {
  setupVideoUpload();
  setupExport();
}

function setupVideoUpload() {
  dom.dropzoneVid.addEventListener('click', () => dom.fileInputVid.click());
  dom.fileInputVid.addEventListener('change', (e) => {
    handleFiles(e.target.files);
    dom.fileInputVid.value = '';
  });
  dom.dropzoneVid.addEventListener('dragover', (e) => { e.preventDefault(); dom.dropzoneVid.classList.add('dragover'); });
  dom.dropzoneVid.addEventListener('dragleave', () => dom.dropzoneVid.classList.remove('dragover'));
  dom.dropzoneVid.addEventListener('drop', (e) => {
    e.preventDefault();
    dom.dropzoneVid.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  });
}

function handleFiles(files) {
  if (state.isProcessing) return;
  for (const file of files) {
    if (file.type.startsWith('video/')) {
      if (state.videos.length < state.maxVideos) {
        state.videos.push(file);
      } else {
        alert(`Maximum of ${state.maxVideos} videos allowed.`);
        break;
      }
    }
  }
  renderVideoList();
  updateExportState();
  if (state.videos.length > 0) preloadFFmpeg();
}

function removeVideo(index) {
  if (state.isProcessing) return;
  state.videos.splice(index, 1);
  renderVideoList();
  updateExportState();
}

function renderVideoList() {
  dom.videoList.innerHTML = '';
  state.videos.forEach((file, index) => {
    const li = document.createElement('li');
    li.className = 'video-item';
    li.innerHTML = `
      <div class="video-item__info">
        <span class="video-item__index">${index + 1}</span>
        <div style="display:flex; flex-direction:column; gap:2px;">
          <span class="video-item__name">${file.name}</span>
          <span class="video-item__size">${(file.size / 1024 / 1024).toFixed(1)} MB</span>
        </div>
      </div>
      <button class="btn-remove-vid" data-index="${index}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;
    dom.videoList.appendChild(li);
  });

  document.querySelectorAll('.btn-remove-vid').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.dataset.index);
      removeVideo(idx);
    });
  });
}

function updateExportState() {
  const ready = state.videos.length >= 2;
  dom.btnExport.disabled = !ready || state.isProcessing;
  
  if (state.videos.length === 0) dom.exportNote.textContent = 'Upload at least 2 videos to merge';
  else if (state.videos.length === 1) dom.exportNote.textContent = 'Upload 1 more video to merge';
  else dom.exportNote.textContent = `Ready to merge ${state.videos.length} videos`;
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
  dom.btnExport.addEventListener('click', processMerge);
}

async function processMerge() {
  if (state.videos.length < 2 || state.isProcessing) return;
  
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
    ffmpeg.on('progress', ({ progress, time }) => {
      let p = Math.min(Math.round(progress * 100), 100);
      if (p === 0 && time > 0 && dom.videoPlayer && dom.videoPlayer.duration) {
        p = Math.min(Math.round((time / 1000000) / dom.videoPlayer.duration * 100), 100);
      }
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

    let listContent = '';
    const inputFiles = [];

    dom.exportBtnText.textContent = 'Reading files...';
    
    // Write all files to FFmpeg FS and create list.txt
    for (let i = 0; i < state.videos.length; i++) {
      const file = state.videos[i];
      const ext = file.name.split('.').pop().toLowerCase() || 'mp4';
      const fName = `vid_${i}.${ext}`;
      inputFiles.push(fName);
      
      await ffmpeg.writeFile(fName, await fetchFile(file));
      listContent += `file '${fName}'\n`;
    }

    await ffmpeg.writeFile('list.txt', listContent);

    dom.exportBtnText.textContent = 'Merging videos...';
    const outName = 'output_merged.mp4';
    
    // Use concat demuxer (requires same codecs/resolutions)
    await ffmpeg.exec([
      '-y',
      '-threads', /Mobi|Android/i.test(navigator.userAgent) ? '1' : '4',
      '-f', 'concat',
      '-safe', '0',
      '-i', 'list.txt',
      '-c', 'copy',
      outName
    ]);

    dom.exportBtnText.textContent = 'Saving...';
    const data = await ffmpeg.readFile(outName);
    const blob = new Blob([data.buffer], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `clipy_merged.mp4`;
    a.click();

    // Cleanup
    for (const fName of inputFiles) {
      await ffmpeg.deleteFile(fName);
    }
    await ffmpeg.deleteFile('list.txt');
    await ffmpeg.deleteFile(outName);

    dom.exportBtnText.textContent = 'Done ✓';
    dom.exportFill.style.width = '100%';
    dom.exportFill.style.background = 'rgba(239, 68, 68, 0.2)';

    setTimeout(() => {
      dom.exportBtnText.textContent = 'Merge Videos';
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
    setTimeout(() => { dom.exportBtnText.textContent = 'Merge Videos'; updateExportState(); }, 3000);
  }
}

init();
