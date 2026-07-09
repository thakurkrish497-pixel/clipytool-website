import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        crop: resolve(__dirname, 'crop/index.html'),
        watermark: resolve(__dirname, 'watermark/index.html'),
        videoToGif: resolve(__dirname, 'video-to-gif/index.html'),
        gifMaker: resolve(__dirname, 'gif-maker/index.html'),
        videoCutter: resolve(__dirname, 'video-cutter/index.html'),
        videoToMp4: resolve(__dirname, 'video-to-mp4/index.html'),
        videoSpeed: resolve(__dirname, 'video-speed/index.html'),
        videoToImage: resolve(__dirname, 'video-to-image/index.html'),
        videoResize: resolve(__dirname, 'video-resize/index.html'),
        videoRotate: resolve(__dirname, 'video-rotate/index.html'),
        videoReverse: resolve(__dirname, 'video-reverse/index.html'),
        videoFilters: resolve(__dirname, 'video-filters/index.html'),
        videoMerge: resolve(__dirname, 'video-merge/index.html'),
        videoToWebm: resolve(__dirname, 'video-to-webm/index.html'),
        extractAudio: resolve(__dirname, 'extract-audio/index.html'),
        muteVideo: resolve(__dirname, 'mute-video/index.html'),
        compressVideo: resolve(__dirname, 'compress-video/index.html'),
        loopVideo: resolve(__dirname, 'loop-video/index.html'),
        about: resolve(__dirname, 'about/index.html'),
        privacy: resolve(__dirname, 'privacy/index.html'),
        terms: resolve(__dirname, 'terms/index.html'),
      },
    },
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
});
