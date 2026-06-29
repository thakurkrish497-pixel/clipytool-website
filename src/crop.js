/* ============================================
   RATIO. — Main Application Logic
   Client-side video cropping with FFmpeg.wasm
   ============================================ */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

// ============================================
// STATE
// ============================================
const state = {
  videoFile: null,        // File object
  videoURL: null,         // Object URL for preview
  videoWidth: 0,
  videoHeight: 0,
  targetRatio: '9:16',   // '9:16' or '16:9'
  ffmpeg: null,
  ffmpegLoaded: false,
  ffmpegLoading: false,
  isProcessing: false,
};


// ============================================
// DOM REFERENCES
// ============================================
const $ = (id) => document.getElementById(id);

const dom = {
  // Video
  videoStage:    $('videoStage'),
  videoEmpty:    $('videoEmpty'),
  videoPlayer:   $('videoPlayer'),
  cropOverlay:   $('cropOverlay'),
  cropLabel:     $('cropRatioLabel'),
  videoControls: $('videoControls'),
  btnPlayPause:  $('btnPlayPause'),
  iconPlay:      $('iconPlay'),
  iconPause:     $('iconPause'),
  seekBar:       $('seekBar'),
  seekFill:      $('seekFill'),
  timeDisplay:   $('timeDisplay'),

  // Upload
  dropzone:  $('dropzone'),
  fileInfo:  $('fileInfo'),
  fileInput: $('fileInput'),
  fileName:  $('fileName'),
  fileDetails: $('fileDetails'),
  btnChange: $('btnChange'),

  // Ratio
  btn916:      $('btn916'),
  btn169:      $('btn169'),
  ratioSlider: $('ratioSlider'),

  // Export
  btnExport:      $('btnExport'),
  exportFill:     $('exportFill'),
  exportBtnContent: $('exportBtnContent'),
  exportBtnText:  $('exportBtnText'),
  exportNote:     $('exportNote'),
};


// ============================================
// INITIALIZATION
// ============================================
function init() {
  setupDropzone();
  setupRatioToggle();
  setupExportButton();
  setupVideoControls();
  setupResizeObserver();
}


// ============================================
// DROPZONE / FILE UPLOAD
// ============================================
function setupDropzone() {
  const { dropzone, fileInput } = dom;

  // Click to browse
  dropzone.addEventListener('click', () => fileInput.click());
  dom.btnChange.addEventListener('click', () => fileInput.click());

  // File input change
  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  });

  // Drag & drop
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.add('drag-over');
  });

  dropzone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove('drag-over');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove('drag-over');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  // Also allow drop on the whole page
  document.addEventListener('dragover', (e) => e.preventDefault());
  document.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        handleFile(file);
      }
    }
  });
}


function handleFile(file) {
  if (!file.type.startsWith('video/')) {
    alert('Please upload a video file.');
    return;
  }

  // Clean up previous URL
  if (state.videoURL) {
    URL.revokeObjectURL(state.videoURL);
  }

  state.videoFile = file;
  state.videoURL = URL.createObjectURL(file);

  // Update UI: switch from dropzone to file info
  dom.dropzone.classList.add('hidden');
  dom.fileInfo.classList.add('visible');
  dom.fileName.textContent = file.name;

  // Format file size
  const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
  dom.fileDetails.textContent = `${sizeMB} MB`;

  // Load video into player
  loadVideo(state.videoURL);

  // Start loading FFmpeg in background
  loadFFmpeg();
}


// ============================================
// VIDEO PLAYER
// ============================================
function loadVideo(url) {
  const video = dom.videoPlayer;

  video.src = url;
  video.load();

  video.addEventListener('loadedmetadata', function onMeta() {
    video.removeEventListener('loadedmetadata', onMeta);

    state.videoWidth = video.videoWidth;
    state.videoHeight = video.videoHeight;

    // Update file details with resolution
    const sizeMB = (state.videoFile.size / (1024 * 1024)).toFixed(1);
    dom.fileDetails.textContent = `${video.videoWidth}×${video.videoHeight} · ${sizeMB} MB`;

    // Show video, hide empty state
    dom.videoEmpty.style.display = 'none';
    video.classList.add('visible');
    dom.videoControls.classList.add('visible');

    // Enable export button
    dom.btnExport.disabled = false;
    dom.exportNote.textContent = 'Ready to crop your video';
    dom.btnExport.classList.remove('processing', 'loading', 'done');

    // Update crop overlay
    updateCropOverlay();

    // Play briefly to show first frames, then pause
    video.currentTime = 0;
  });
}

function setupVideoControls() {
  const video = dom.videoPlayer;

  dom.btnPlayPause.addEventListener('click', () => {
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  });

  video.addEventListener('play', () => {
    dom.iconPlay.style.display = 'none';
    dom.iconPause.style.display = 'block';
  });

  video.addEventListener('pause', () => {
    dom.iconPlay.style.display = 'block';
    dom.iconPause.style.display = 'none';
  });

  video.addEventListener('timeupdate', () => {
    if (!video.duration) return;
    const progress = (video.currentTime / video.duration) * 1000;
    dom.seekBar.value = progress;
    dom.seekFill.style.width = `${(progress / 1000) * 100}%`;
    dom.timeDisplay.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
  });

  dom.seekBar.addEventListener('input', () => {
    if (!video.duration) return;
    const time = (dom.seekBar.value / 1000) * video.duration;
    video.currentTime = time;
    dom.seekFill.style.width = `${(dom.seekBar.value / 1000) * 100}%`;
  });
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}


// ============================================
// CROP OVERLAY VISUALIZATION
// ============================================
function updateCropOverlay() {
  const video = dom.videoPlayer;
  const stage = dom.videoStage;
  const overlay = dom.cropOverlay;

  if (!state.videoWidth || !state.videoHeight) {
    overlay.classList.remove('visible');
    return;
  }

  const stageW = stage.clientWidth;
  const stageH = stage.clientHeight;
  const videoW = state.videoWidth;
  const videoH = state.videoHeight;

  // Calculate how the video is displayed (object-fit: contain)
  const stageAspect = stageW / stageH;
  const videoAspect = videoW / videoH;

  let displayW, displayH, videoOffsetX, videoOffsetY;

  if (videoAspect > stageAspect) {
    // Video wider than container → full width, letterboxed
    displayW = stageW;
    displayH = stageW / videoAspect;
    videoOffsetX = 0;
    videoOffsetY = (stageH - displayH) / 2;
  } else {
    // Video taller than container → full height, pillarboxed
    displayH = stageH;
    displayW = stageH * videoAspect;
    videoOffsetX = (stageW - displayW) / 2;
    videoOffsetY = 0;
  }

  // Calculate crop dimensions in original video pixels
  const targetAspect = state.targetRatio === '9:16' ? 9 / 16 : 16 / 9;
  const inputAspect = videoW / videoH;

  let cropW, cropH, cropX, cropY;

  if (Math.abs(inputAspect - targetAspect) < 0.01) {
    // Already in target ratio
    overlay.classList.remove('visible');
    dom.exportNote.textContent = 'Video is already in the target ratio';
    return;
  }

  if (inputAspect > targetAspect) {
    // Input wider than target → crop width (left & right)
    cropH = videoH;
    cropW = Math.round(videoH * targetAspect);
    cropW = cropW % 2 === 0 ? cropW : cropW - 1; // ensure even
    cropX = Math.round((videoW - cropW) / 2);
    cropY = 0;
  } else {
    // Input taller than target → crop height (top & bottom)
    cropW = videoW;
    cropH = Math.round(videoW / targetAspect);
    cropH = cropH % 2 === 0 ? cropH : cropH - 1; // ensure even
    cropX = 0;
    cropY = Math.round((videoH - cropH) / 2);
  }

  // Map crop area to display coordinates
  const scaleX = displayW / videoW;
  const scaleY = displayH / videoH;

  const overlayLeft = videoOffsetX + cropX * scaleX;
  const overlayTop = videoOffsetY + cropY * scaleY;
  const overlayWidth = cropW * scaleX;
  const overlayHeight = cropH * scaleY;

  overlay.style.left = `${overlayLeft}px`;
  overlay.style.top = `${overlayTop}px`;
  overlay.style.width = `${overlayWidth}px`;
  overlay.style.height = `${overlayHeight}px`;

  dom.cropLabel.textContent = state.targetRatio;
  overlay.classList.add('visible');

  // Update export note
  dom.exportNote.textContent = `Output: ${cropW}×${cropH} (${state.targetRatio})`;
}

function setupResizeObserver() {
  const observer = new ResizeObserver(() => {
    if (state.videoWidth) {
      updateCropOverlay();
    }
  });
  observer.observe(dom.videoStage);
}


// ============================================
// RATIO TOGGLE
// ============================================
function setupRatioToggle() {
  dom.btn916.addEventListener('click', () => setRatio('9:16'));
  dom.btn169.addEventListener('click', () => setRatio('16:9'));
}

function setRatio(ratio) {
  if (state.isProcessing) return;

  state.targetRatio = ratio;

  // Update button states
  dom.btn916.classList.toggle('active', ratio === '9:16');
  dom.btn169.classList.toggle('active', ratio === '16:9');

  // Move slider
  dom.ratioSlider.classList.toggle('right', ratio === '16:9');

  // Update overlay
  updateCropOverlay();
}


// ============================================
// FFMPEG LOADING & PROCESSING
// ============================================
async function loadFFmpeg() {
  if (state.ffmpegLoaded || state.ffmpegLoading) return;
  state.ffmpegLoading = true;

  try {
    const ffmpeg = new FFmpeg();

    // Log messages for debugging
    ffmpeg.on('log', ({ message }) => {
      console.log('[ffmpeg]', message);
    });

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
    await ffmpeg.load(loadOpts);

    state.ffmpeg = ffmpeg;
    state.ffmpegLoaded = true;
    console.log('[ratio] FFmpeg loaded successfully');
  } catch (err) {
    console.error('[ratio] Failed to load FFmpeg:', err);
    state.ffmpegLoading = false;
    throw err;
  }
}


function setupExportButton() {
  dom.btnExport.addEventListener('click', processVideo);
}


async function processVideo() {
  if (state.isProcessing || !state.videoFile) return;
  state.isProcessing = true;

  const { videoWidth: videoW, videoHeight: videoH, targetRatio, videoFile } = state;
  const ffmpeg = state.ffmpeg;

  // Calculate crop
  const targetAspect = targetRatio === '9:16' ? 9 / 16 : 16 / 9;
  const inputAspect = videoW / videoH;

  let cropW, cropH, cropX, cropY;

  if (inputAspect > targetAspect) {
    cropH = videoH;
    cropW = Math.round(videoH * targetAspect);
    cropW = cropW % 2 === 0 ? cropW : cropW - 1;
    cropX = Math.round((videoW - cropW) / 2);
    cropY = 0;
  } else {
    cropW = videoW;
    cropH = Math.round(videoW / targetAspect);
    cropH = cropH % 2 === 0 ? cropH : cropH - 1;
    cropX = 0;
    cropY = Math.round((videoH - cropH) / 2);
  }

  try {
    // Show loading state if FFmpeg not ready
    if (!state.ffmpegLoaded) {
      setExportState('loading', 'Loading engine...');
      await loadFFmpeg();
    }

    setExportState('processing', '0%');

    const ffmpegInst = state.ffmpeg;

    // Set up progress tracking
    let processStartTime = Date.now();
    ffmpegInst.on('progress', ({ progress }) => {
      const pct = Math.min(Math.round(progress * 100), 100);
      
      let etaStr = '';
      if (progress > 0.01 && progress < 1) {
          const elapsed = (Date.now() - processStartTime) / 1000;
          const totalEstimated = elapsed / progress;
          const remaining = totalEstimated - elapsed;
          if (remaining > 0 && remaining < 7200) {
              const mins = Math.floor(remaining / 60);
              const secs = Math.floor(remaining % 60);
              etaStr = ` (ETA: ${mins > 0 ? mins + 'm ' : ''}${secs}s)`;
          }
      }
      
      setExportState('processing', `${pct}%${etaStr}`, pct);
    });

    // Write input file
    const inputName = 'input' + getExtension(videoFile.name);
    await ffmpegInst.writeFile(inputName, await fetchFile(videoFile));

    // Build FFmpeg command
    const cropFilter = `crop=${cropW}:${cropH}:${cropX}:${cropY}`;
    console.log(`[ratio] Crop filter: ${cropFilter}`);

    await ffmpegInst.exec([
      '-i', inputName,
      '-vf', cropFilter,
      '-c:a', 'copy', '-threads', /Mobi|Android/i.test(navigator.userAgent) ? '1' : '4', '-preset', 'ultrafast',
      '-movflags', '+faststart',
      'output.mp4',
    ]);

    // Read output
    const outputData = await ffmpegInst.readFile('output.mp4');
    const blob = new Blob([outputData.buffer], { type: 'video/mp4' });

    // Show done state
    setExportState('done', 'Done ✓');

    // Trigger download
    const downloadURL = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const baseName = videoFile.name.replace(/\.[^/.]+$/, '');
    a.href = downloadURL;
    a.download = `${baseName}_${targetRatio.replace(':', 'x')}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Cleanup
    setTimeout(() => URL.revokeObjectURL(downloadURL), 1000);

    // Clean up FFmpeg files
    try {
      await ffmpegInst.deleteFile(inputName);
      await ffmpegInst.deleteFile('output.mp4');
    } catch (_) { /* ignore cleanup errors */ }

    // Reset button after a delay
    setTimeout(() => {
      setExportState('ready', 'Process & Download');
      state.isProcessing = false;
    }, 2500);

  } catch (err) {
    console.error('[ratio] Processing failed:', err);
    setExportState('error', 'Error — Try Again');
    state.isProcessing = false;

    setTimeout(() => {
      setExportState('ready', 'Process & Download');
    }, 3000);
  }
}


function setExportState(mode, text, progress = 0) {
  const btn = dom.btnExport;
  const fill = dom.exportFill;
  const btnText = dom.exportBtnText;
  const note = dom.exportNote;

  // Remove all state classes
  btn.classList.remove('processing', 'loading', 'done');

  switch (mode) {
    case 'loading':
      btn.classList.add('loading');
      btn.disabled = true;
      btnText.textContent = text;
      note.textContent = 'Downloading FFmpeg engine (~30 MB)...';
      fill.style.width = '0%';
      break;

    case 'processing':
      btn.classList.add('processing');
      btn.disabled = true;
      btnText.textContent = text;
      fill.style.width = `${progress}%`;
      note.textContent = 'Processing your video...';
      break;

    case 'done':
      btn.classList.add('done');
      btn.disabled = true;
      btnText.textContent = text;
      fill.style.width = '100%';
      note.textContent = 'Download started!';
      break;

    case 'error':
      btn.disabled = false;
      btnText.textContent = text;
      fill.style.width = '0%';
      note.textContent = 'Something went wrong. Please try again.';
      break;

    case 'ready':
    default:
      btn.disabled = false;
      btnText.textContent = text;
      fill.style.width = '0%';
      if (state.videoFile) {
        note.textContent = `Ready to crop your video`;
        updateCropOverlay(); // Refresh note with dimensions
      }
      break;
  }
}


function getExtension(filename) {
  const match = filename.match(/\.[^/.]+$/);
  return match ? match[0] : '.mp4';
}


// ============================================
// LAUNCH
// ============================================
init();
