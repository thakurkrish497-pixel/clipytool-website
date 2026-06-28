const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, 'src');

const files = fs.readdirSync(src).filter(f => f.endsWith('.js'));
for (const file of files) {
  const p = path.join(src, file);
  let c = fs.readFileSync(p, 'utf8');
  let orig = c;

  c = c.replace(
    /wasmURL:,\n      workerURL: await toBlobURL\(\$\{baseURL\}\/ffmpeg-core\.worker\.js, 'text\/javascript'\), 'application\/wasm'\),/g,
    "wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),\n      workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),"
  );
  
  c = c.replace(
    /wasmURL:,\r?\n\s*workerURL: await toBlobURL\(\$\{baseURL\}\/ffmpeg-core\.worker\.js, 'text\/javascript'\), 'application\/wasm'\),/g,
    "wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),\n      workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),"
  );

  // Broad fallback regex in case of slight variations
  // Let's just manually replace the entire block
  c = c.replace(/coreURL: await toBlobURL\(`\$\{baseURL\}\/ffmpeg-core\.js`, 'text\/javascript'\),[\s\S]*?\}\);/g,
    `coreURL: await toBlobURL(\`\${baseURL}/ffmpeg-core.js\`, 'text/javascript'),
      wasmURL: await toBlobURL(\`\${baseURL}/ffmpeg-core.wasm\`, 'application/wasm'),
      workerURL: await toBlobURL(\`\${baseURL}/ffmpeg-core.worker.js\`, 'text/javascript'),
    });`
  );

  if (orig !== c) {
    fs.writeFileSync(p, c);
    console.log('Fixed worker syntax in ' + file);
  }
}
