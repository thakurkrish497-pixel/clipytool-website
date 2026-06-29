const fs = require('fs');
const path = require('path');
const dir = './src';

const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
for (const file of files) {
  const p = path.join(dir, file);
  let c = fs.readFileSync(p, 'utf8');

  // Match: const baseURL = '...'; [optional whitespace] await (state.ffmpeg|ffmpeg).load({ ... });
  const regex = /const baseURL = 'https:\/\/unpkg\.com\/@ffmpeg\/core-mt@0\.12\.6\/dist\/esm';\s*await (state\.ffmpeg|ffmpeg)\.load\(\{\s*coreURL: await toBlobURL\(`\$\{baseURL\}\/ffmpeg-core\.js`, 'text\/javascript'\),\s*wasmURL: await toBlobURL\(`\$\{baseURL\}\/ffmpeg-core\.wasm`, 'application\/wasm'\),\s*workerURL: await toBlobURL\(`\$\{baseURL\}\/ffmpeg-core\.worker\.js`, 'text\/javascript'\),?\s*\}\);/g;

  let orig = c;
  c = c.replace(regex, (match, ffmpegInst) => {
    return `const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    const coreName = isMobile ? 'core' : 'core-mt';
    const baseURL = \`https://unpkg.com/@ffmpeg/\${coreName}@0.12.6/dist/esm\`;
    const loadOpts = {
      coreURL: await toBlobURL(\`\${baseURL}/ffmpeg-core.js\`, 'text/javascript'),
      wasmURL: await toBlobURL(\`\${baseURL}/ffmpeg-core.wasm\`, 'application/wasm'),
    };
    if (!isMobile) {
      loadOpts.workerURL = await toBlobURL(\`\${baseURL}/ffmpeg-core.worker.js\`, 'text/javascript');
    }
    await ${ffmpegInst}.load(loadOpts);`;
  });

  if (orig !== c) {
    fs.writeFileSync(p, c);
    console.log('Fixed ' + file);
  }
}
