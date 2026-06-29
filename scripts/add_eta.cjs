const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.js'));

let totalModified = 0;

for (const file of files) {
    const filePath = path.join(srcDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Skip if already has ETA
    if (content.includes('etaStr =')) {
        console.log(`Skipping ${file} - already has ETA logic`);
        continue;
    }

    const regex = /ffmpeg\.on\('progress',\s*\(\{\s*progress\s*\}\)\s*=>\s*\{([\s\S]*?)dom\.exportBtnText\.textContent\s*=\s*`([^$]*?)\$\{([^}]*)\}%`;\s*\}\);/g;

    const newContent = content.replace(regex, (match, beforeAssignment, prefixText, varName) => {
        return `let processStartTime = Date.now();
    ffmpeg.on('progress', ({ progress }) => {${beforeAssignment}
      let etaStr = '';
      if (progress > 0.01 && progress < 1) {
          const elapsed = (Date.now() - processStartTime) / 1000;
          const totalEstimated = elapsed / progress;
          const remaining = totalEstimated - elapsed;
          if (remaining > 0 && remaining < 7200) { // cap at 2 hours for sanity
              const mins = Math.floor(remaining / 60);
              const secs = Math.floor(remaining % 60);
              etaStr = \\\` (ETA: \\\${mins > 0 ? mins + 'm ' : ''}\\\${secs}s)\\\`;
          }
      }
      dom.exportBtnText.textContent = \\\`${prefixText}\\\${${varName}}%\\\${etaStr}\\\`;
    });`;
    });

    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Modified ${file}`);
        totalModified++;
    } else {
        console.log(`No match found in ${file}`);
    }
}

console.log(`\nCompleted! Modified ${totalModified} files.`);
