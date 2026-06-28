/* ============================================
   WATERMARK TOOL — Application Logic
   Client-side watermark overlay with FFmpeg.wasm
   ============================================ */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

// ============================================
// STATE
// ============================================
const state = {
  videoFile: null,
  videoURL: null,
  videoWidth: 0,
  videoHeight: 0,
  wmMode: 'image',         // 'image' | 'text'
  wmImageFile: null,
  wmImageURL: null,
  wmText: '',
  wmTextColor: '#ffffff',
  wmTextSize: 36,
  wmPosition: 'br',        // tl tc tr ml mc mr bl bc br
  wmOpacity: 80,            // 5–100
  wmScale: 20,              // 5–80 (% of video width)
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
  videoStage:    $('videoStage'),
  videoEmpty:    $('videoEmpty'),
  videoPlayer:   $('videoPlayer'),
  videoControls: $('videoControls'),
  btnPlayPause:  $('btnPlayPause'),
  iconPlay:      $('iconPlay'),
  iconPause:     $('iconPause'),
  seekBar:       $('seekBar'),
  seekFill:      $('seekFill'),
  timeDisplay:   $('timeDisplay'),

  // Upload Video
  dropzoneVid:   $('dropzoneVid'),
  fileInputVid:  $('fileInputVid'),
  fileInfoVid:   $('fileInfoVid'),
  fileNameVid:   $('fileNameVid'),
  fileDetailsVid:$('fileDetailsVid'),
  btnChangeVid:  $('btnChangeVid'),

  // Upload Watermark
  dropzoneMark:  $('dropzoneMark'),
  fileInputMark: $('fileInputMark'),
  fileInfoMark:  $('fileInfoMark'),
  fileNameMark:  $('fileNameMark'),
  btnChangeMark: $('btnChangeMark'),

  // Mode toggle
  modeImage:     $('modeImage'),
  modeText:      $('modeText'),
  wmModeSlider:  $('wmModeSlider'),
  imageArea:     $('imageArea'),
  textArea:      $('textArea'),

  // Text inputs
  wmTextInput:   $('wmTextInput'),
  wmTextColor:   $('wmTextColor'),
  wmTextSize:    $('wmTextSize'),

  // Preview
  wmPreviewLayer:$('wmPreviewLayer'),
  wmPreviewImg:  $('wmPreviewImg'),
  wmPreviewText: $('wmPreviewText'),

  // Position & Style
  posGrid:       $('posGrid'),
  sliderOpacity: $('sliderOpacity'),
  opacityValue:  $('opacityValue'),
  sliderScale:   $('sliderScale'),
  scaleValue:    $('scaleValue'),

  // Export
  btnExport:     $('btnExport'),
  exportNote:    $('exportNote'),
  exportBtnText: $('exportBtnText'),
  exportFill:    $('exportFill'),
};


// ============================================
// INIT
// ============================================
function init() {
  setupVideoUpload();
  setupWatermarkUpload();
  setupModeToggle();
  setupTextInputs();
  setupPositionGrid();
  setupSliders();
  setupVideoControls();
  setupExport();
}


// ============================================
// VIDEO UPLOAD
// ============================================
function setupVideoUpload() {
  dom.dropzoneVid.addEventListener('click', () => dom.fileInputVid.click());
  dom.btnChangeVid.addEventListener('click', () => dom.fileInputVid.click());
  dom.fileInputVid.addEventListener('change', (e) => {
    if (e.target.files[0]) loadVideo(e.target.files[0]);
  });

  // Drag & drop
  dom.dropzoneVid.addEventListener('dragover', (e) => {
    e.preventDefault();
    dom.dropzoneVid.classList.add('dragover');
  });
  dom.dropzoneVid.addEventListener('dragleave', () => {
    dom.dropzoneVid.classList.remove('dragover');
  });
  dom.dropzoneVid.addEventListener('drop', (e) => {
    e.preventDefault();
    dom.dropzoneVid.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) loadVideo(file);
  });
}

function loadVideo(file) {
  state.videoFile = file;
  if (state.videoURL) URL.revokeObjectURL(state.videoURL);
  state.videoURL = URL.createObjectURL(file);

  dom.videoPlayer.src = state.videoURL;
  dom.videoPlayer.onloadedmetadata = () => {
    state.videoWidth = dom.videoPlayer.videoWidth;
    state.videoHeight = dom.videoPlayer.videoHeight;

    dom.fileNameVid.textContent = file.name;
    dom.fileDetailsVid.textContent = `${state.videoWidth}×${state.videoHeight} · ${formatSize(file.size)}`;

    dom.dropzoneVid.style.display = 'none';
    dom.fileInfoVid.style.display = 'flex';
    dom.videoEmpty.style.display = 'none';
    dom.videoPlayer.style.display = 'block';
    dom.videoControls.style.display = 'flex';

    updateExportState();
    updatePreviewOverlay();
    preloadFFmpeg();
  };
}

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}


// ============================================
// WATERMARK IMAGE UPLOAD
// ============================================
function setupWatermarkUpload() {
  dom.dropzoneMark.addEventListener('click', () => dom.fileInputMark.click());
  dom.btnChangeMark.addEventListener('click', () => dom.fileInputMark.click());
  dom.fileInputMark.addEventListener('change', (e) => {
    if (e.target.files[0]) loadWatermarkImage(e.target.files[0]);
  });

  dom.dropzoneMark.addEventListener('dragover', (e) => {
    e.preventDefault();
    dom.dropzoneMark.classList.add('dragover');
  });
  dom.dropzoneMark.addEventListener('dragleave', () => {
    dom.dropzoneMark.classList.remove('dragover');
  });
  dom.dropzoneMark.addEventListener('drop', (e) => {
    e.preventDefault();
    dom.dropzoneMark.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) loadWatermarkImage(file);
  });
}

function loadWatermarkImage(file) {
  state.wmImageFile = file;
  if (state.wmImageURL) URL.revokeObjectURL(state.wmImageURL);
  state.wmImageURL = URL.createObjectURL(file);

  dom.fileNameMark.textContent = file.name;
  dom.dropzoneMark.style.display = 'none';
  dom.fileInfoMark.style.display = 'flex';

  dom.wmPreviewImg.src = state.wmImageURL;

  updateExportState();
  updatePreviewOverlay();
}


// ============================================
// MODE TOGGLE (Image / Text)
// ============================================
function setupModeToggle() {
  dom.modeImage.addEventListener('click', () => setMode('image'));
  dom.modeText.addEventListener('click', () => setMode('text'));
}

function setMode(mode) {
  state.wmMode = mode;

  dom.modeImage.classList.toggle('active', mode === 'image');
  dom.modeText.classList.toggle('active', mode === 'text');
  dom.wmModeSlider.classList.toggle('right', mode === 'text');

  dom.imageArea.style.display = mode === 'image' ? 'flex' : 'none';
  dom.textArea.style.display = mode === 'text' ? 'flex' : 'none';

  updateExportState();
  updatePreviewOverlay();
}


// ============================================
// TEXT INPUTS
// ============================================
function setupTextInputs() {
  dom.wmTextInput.addEventListener('input', (e) => {
    state.wmText = e.target.value;
    updateExportState();
    updatePreviewOverlay();
  });

  dom.wmTextColor.addEventListener('input', (e) => {
    state.wmTextColor = e.target.value;
    updatePreviewOverlay();
  });

  dom.wmTextSize.addEventListener('input', (e) => {
    state.wmTextSize = parseInt(e.target.value);
    updatePreviewOverlay();
  });
}


// ============================================
// POSITION GRID
// ============================================
function setupPositionGrid() {
  const posMap = ['tl', 'tc', 'tr', 'ml', 'mc', 'mr', 'bl', 'bc', 'br'];
  const buttons = dom.posGrid.querySelectorAll('.pos-btn');

  buttons.forEach((btn, i) => {
    btn.dataset.pos = posMap[i];
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.wmPosition = posMap[i];
      updatePreviewOverlay();
    });
  });

  // Set initial active (bottom-right)
  buttons.forEach(b => b.classList.remove('active'));
  buttons[8].classList.add('active'); // br
  state.wmPosition = 'br';
}


// ============================================
// SLIDERS
// ============================================
function setupSliders() {
  dom.sliderOpacity.addEventListener('input', (e) => {
    state.wmOpacity = parseInt(e.target.value);
    dom.opacityValue.textContent = state.wmOpacity + '%';
    updatePreviewOverlay();
  });

  dom.sliderScale.addEventListener('input', (e) => {
    state.wmScale = parseInt(e.target.value);
    dom.scaleValue.textContent = state.wmScale + '%';
    updatePreviewOverlay();
  });
}


// ============================================
// PREVIEW OVERLAY
// ============================================
function updatePreviewOverlay() {
  if (!state.videoFile) {
    dom.wmPreviewLayer.classList.remove('visible');
    return;
  }

  const hasWatermark = (state.wmMode === 'image' && state.wmImageFile) ||
                       (state.wmMode === 'text' && state.wmText.trim());

  if (!hasWatermark) {
    dom.wmPreviewLayer.classList.remove('visible');
    return;
  }

  dom.wmPreviewLayer.classList.add('visible');

  const isImage = state.wmMode === 'image';
  dom.wmPreviewImg.classList.toggle('visible', isImage);
  dom.wmPreviewText.classList.toggle('visible', !isImage);

  // Calculate position
  const margin = 5; // % margin from edges
  const opacity = state.wmOpacity / 100;

  const posStyles = {
    tl: { top: `${margin}%`, left: `${margin}%`, bottom: 'auto', right: 'auto', transform: 'none' },
    tc: { top: `${margin}%`, left: '50%', bottom: 'auto', right: 'auto', transform: 'translateX(-50%)' },
    tr: { top: `${margin}%`, left: 'auto', bottom: 'auto', right: `${margin}%`, transform: 'none' },
    ml: { top: '50%', left: `${margin}%`, bottom: 'auto', right: 'auto', transform: 'translateY(-50%)' },
    mc: { top: '50%', left: '50%', bottom: 'auto', right: 'auto', transform: 'translate(-50%, -50%)' },
    mr: { top: '50%', left: 'auto', bottom: 'auto', right: `${margin}%`, transform: 'translateY(-50%)' },
    bl: { top: 'auto', left: `${margin}%`, bottom: `${margin}%`, right: 'auto', transform: 'none' },
    bc: { top: 'auto', left: '50%', bottom: `${margin}%`, right: 'auto', transform: 'translateX(-50%)' },
    br: { top: 'auto', left: 'auto', bottom: `${margin}%`, right: `${margin}%`, transform: 'none' },
  };

  const pos = posStyles[state.wmPosition] || posStyles.br;

  if (isImage) {
    const el = dom.wmPreviewImg;
    Object.assign(el.style, pos);
    el.style.opacity = opacity;
    el.style.maxWidth = state.wmScale + '%';
    el.style.maxHeight = state.wmScale + '%';
  } else {
    const el = dom.wmPreviewText;
    el.textContent = state.wmText;
    Object.assign(el.style, pos);
    el.style.opacity = opacity;
    el.style.color = state.wmTextColor;
    // Scale font size relative to the preview container
    const containerWidth = dom.videoStage.offsetWidth;
    const scaledSize = Math.max(10, (state.wmTextSize / 1920) * containerWidth * (state.wmScale / 20));
    el.style.fontSize = scaledSize + 'px';
  }
}


// ============================================
// VIDEO CONTROLS
// ============================================
function setupVideoControls() {
  const vid = dom.videoPlayer;

  dom.btnPlayPause.addEventListener('click', () => {
    if (vid.paused) { vid.play(); } else { vid.pause(); }
  });

  vid.addEventListener('play', () => {
    dom.iconPlay.style.display = 'none';
    dom.iconPause.style.display = 'block';
  });
  vid.addEventListener('pause', () => {
    dom.iconPlay.style.display = 'block';
    dom.iconPause.style.display = 'none';
  });

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


// ============================================
// EXPORT STATE
// ============================================
function updateExportState() {
  const hasVideo = !!state.videoFile;
  const hasWatermark = (state.wmMode === 'image' && state.wmImageFile) ||
                       (state.wmMode === 'text' && state.wmText.trim());

  const ready = hasVideo && hasWatermark;
  dom.btnExport.disabled = !ready || state.isProcessing;

  if (!hasVideo) {
    dom.exportNote.textContent = 'Upload a video and watermark';
  } else if (!hasWatermark) {
    dom.exportNote.textContent = state.wmMode === 'image' ? 'Upload a watermark image' : 'Enter watermark text';
  } else {
    dom.exportNote.textContent = `Ready — ${state.wmMode} watermark at ${state.wmPosition.toUpperCase()}, ${state.wmOpacity}% opacity`;
  }
}


// ============================================
// FFMPEG
// ============================================
async function preloadFFmpeg() {
  if (state.ffmpegLoaded || state.ffmpegLoading) return;
  state.ffmpegLoading = true;

  try {
    state.ffmpeg = new FFmpeg();

    const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm';
    await state.ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
    });

    state.ffmpegLoaded = true;
    state.ffmpegLoading = false;
    console.log('[Watermark] FFmpeg.wasm loaded');
  } catch (err) {
    state.ffmpegLoading = false;
    console.error('[Watermark] FFmpeg.wasm failed to load:', err);
  }
}

/**
 * Render text to a transparent PNG using Canvas.
 * This avoids needing a font file in FFmpeg.
 */
async function renderTextToPNG(text, fontSize, color, opacity) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const font = `bold ${fontSize}px Inter, sans-serif`;
  ctx.font = font;
  const metrics = ctx.measureText(text);

  const padding = fontSize * 0.3;
  canvas.width = Math.ceil(metrics.width) + padding * 2;
  canvas.height = Math.ceil(fontSize * 1.4) + padding;

  // Re-apply font after resize
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.globalAlpha = opacity;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, padding, canvas.height / 2);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}


// ============================================
// PROCESS & DOWNLOAD
// ============================================
function setupExport() {
  dom.btnExport.addEventListener('click', processAndDownload);
}

async function processAndDownload() {
  if (state.isProcessing || !state.videoFile) return;
  state.isProcessing = true;
  dom.btnExport.disabled = true;
  dom.exportBtnText.textContent = 'Loading FFmpeg…';
  dom.exportFill.style.width = '0%';
  dom.exportFill.classList.add('active');

  try {
    // Ensure FFmpeg is loaded
    if (!state.ffmpegLoaded) {
      await preloadFFmpeg();
      if (!state.ffmpegLoaded) throw new Error('FFmpeg failed to load');
    }

    const ffmpeg = state.ffmpeg;

    // Progress listener
    ffmpeg.on('progress', ({ progress }) => {
      const pct = Math.min(Math.round(progress * 100), 100);
      dom.exportFill.style.width = pct + '%';
      dom.exportBtnText.textContent = `Processing… ${pct}%`;
    });

    // Write input video
    dom.exportBtnText.textContent = 'Preparing files…';
    await ffmpeg.writeFile('input.mp4', await fetchFile(state.videoFile));

    // Prepare watermark image
    let wmBlob;
    if (state.wmMode === 'text') {
      wmBlob = await renderTextToPNG(
        state.wmText,
        state.wmTextSize * 2, // Render at 2x for quality
        state.wmTextColor,
        1 // Full opacity — we control opacity in FFmpeg
      );
    } else {
      wmBlob = state.wmImageFile;
    }

    await ffmpeg.writeFile('watermark.png', await fetchFile(wmBlob));

    // Calculate position & scale
    const W = state.videoWidth;
    const H = state.videoHeight;
    const margin = Math.round(Math.min(W, H) * 0.05);
    const wmTargetWidth = Math.round(W * (state.wmScale / 100));
    const opacity = state.wmOpacity / 100;

    const posExpr = {
      tl: `${margin}:${margin}`,
      tc: `(main_w-overlay_w)/2:${margin}`,
      tr: `main_w-overlay_w-${margin}:${margin}`,
      ml: `${margin}:(main_h-overlay_h)/2`,
      mc: `(main_w-overlay_w)/2:(main_h-overlay_h)/2`,
      mr: `main_w-overlay_w-${margin}:(main_h-overlay_h)/2`,
      bl: `${margin}:main_h-overlay_h-${margin}`,
      bc: `(main_w-overlay_w)/2:main_h-overlay_h-${margin}`,
      br: `main_w-overlay_w-${margin}:main_h-overlay_h-${margin}`,
    };

    const pos = posExpr[state.wmPosition] || posExpr.br;

    // Build filter complex
    const filterComplex = [
      `[1:v]scale=${wmTargetWidth}:-1,format=rgba,colorchannelmixer=aa=${opacity}[wm]`,
      `[0:v][wm]overlay=${pos}`,
    ].join(';');

    dom.exportBtnText.textContent = 'Processing… 0%';

    await ffmpeg.exec([
      '-i', 'input.mp4',
      '-i', 'watermark.png',
      '-filter_complex', filterComplex,
      '-c:a', 'copy',
      '-threads', '4',
      '-preset', 'ultrafast',
      '-movflags', '+faststart',
      'output.mp4',
    ]);

    // Read output
    const data = await ffmpeg.readFile('output.mp4');
    const blob = new Blob([data.buffer], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);

    // Trigger download
    const a = document.createElement('a');
    a.href = url;
    const baseName = state.videoFile.name.replace(/\.[^/.]+$/, '');
    a.download = `${baseName}_watermarked.mp4`;
    a.click();

    setTimeout(() => URL.revokeObjectURL(url), 10000);

    // Success state
    dom.exportBtnText.textContent = 'Done ✓';
    dom.exportFill.style.width = '100%';
    dom.exportFill.style.background = 'rgba(52, 211, 153, 0.2)';

    // Cleanup
    await ffmpeg.deleteFile('input.mp4');
    await ffmpeg.deleteFile('watermark.png');
    await ffmpeg.deleteFile('output.mp4');

    setTimeout(() => {
      dom.exportBtnText.textContent = 'Process & Download';
      dom.exportFill.style.width = '0%';
      dom.exportFill.style.background = '';
      dom.exportFill.classList.remove('active');
      state.isProcessing = false;
      updateExportState();
    }, 3000);

  } catch (err) {
    console.error('[Watermark] Processing error:', err);
    dom.exportBtnText.textContent = 'Error — try again';
    dom.exportFill.style.width = '0%';
    dom.exportFill.classList.remove('active');
    state.isProcessing = false;

    setTimeout(() => {
      dom.exportBtnText.textContent = 'Process & Download';
      updateExportState();
    }, 3000);
  }
}


// ============================================
// STARTUP
// ============================================
init();
