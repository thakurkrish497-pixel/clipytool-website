const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, 'src');

const files = fs.readdirSync(src).filter(f => f.endsWith('.js'));
for (let file of files) {
  const p = path.join(src, file);
  let c = fs.readFileSync(p, 'utf8');
  let orig = c;

  // Global exec array patching
  if (!c.includes("'-threads', '4'")) {
    c = c.replace(/await ffmpeg\.exec\(\[/g, "await ffmpeg.exec([\n      '-threads', '4',");
    
    // For files pushing to args array:
    c = c.replace(/args\.push\('-c:v', 'libx264'/g, "args.push('-c:v', 'libx264', '-threads', '4', '-preset', 'ultrafast'");
  }

  // Inject -preset ultrafast when libx264 is explicitly called in arrays
  if (!c.includes("'-preset', 'ultrafast'")) {
    c = c.replace(/-c:v', 'libx264',/g, "-c:v', 'libx264',\n      '-preset', 'ultrafast',");
  }

  // Add -threads 4 to exec(args) if not already handled
  if (c.includes("const args = [") && !c.includes("'-threads', '4'")) {
     c = c.replace(/const args = \[/g, "const args = [\n      '-threads', '4',");
  }

  if (orig !== c) {
    fs.writeFileSync(p, c);
    console.log('Patched generically ' + file);
  }
}
