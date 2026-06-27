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
