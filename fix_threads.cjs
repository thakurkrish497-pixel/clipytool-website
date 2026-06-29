const fs = require('fs');
const path = require('path');
const dir = './src';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

for (const file of files) {
  const p = path.join(dir, file);
  let c = fs.readFileSync(p, 'utf8');

  // Fix the broken `-threads,` or `-threads`
  // We need to carefully replace the broken `-threads,` with `'-threads', /Mobi|Android/i.test(navigator.userAgent) ? '1' : '4',`
  
  c = c.replace(/,\s*-threads,\s*'-preset'/g, ", '-threads', /Mobi|Android/i.test(navigator.userAgent) ? '1' : '4', '-preset'");
  c = c.replace(/\[\s*-threads,\s*'-ss'/g, "[\n      '-threads', /Mobi|Android/i.test(navigator.userAgent) ? '1' : '4',\n      '-ss'");
  c = c.replace(/\[\s*-threads,\s*'-i'/g, "[\n      '-threads', /Mobi|Android/i.test(navigator.userAgent) ? '1' : '4',\n      '-i'");
  c = c.replace(/\[\s*-threads,\s*'-f'/g, "[\n      '-threads', /Mobi|Android/i.test(navigator.userAgent) ? '1' : '4',\n      '-f'");
  c = c.replace(/\[\s*-threads,\s*'-filter_complex'/g, "[\n      '-threads', /Mobi|Android/i.test(navigator.userAgent) ? '1' : '4',\n      '-filter_complex'");
  c = c.replace(/\[\s*-threads,\s*outputName/g, "[\n      '-threads', /Mobi|Android/i.test(navigator.userAgent) ? '1' : '4',\n      outputName");
  
  // also handle video-speed, video-reverse, video-rotate, video-filters which had args.push(..., -threads, ...)
  c = c.replace(/,\s*-threads,\s*outputName/g, ", '-threads', /Mobi|Android/i.test(navigator.userAgent) ? '1' : '4', outputName");
  c = c.replace(/,\s*-threads,\s*'-preset'/g, ", '-threads', /Mobi|Android/i.test(navigator.userAgent) ? '1' : '4', '-preset'");
  c = c.replace(/,\s*-threads,\s*outName/g, ", '-threads', /Mobi|Android/i.test(navigator.userAgent) ? '1' : '4', outName");
  
  // Also any stray ` -threads, ` 
  c = c.replace(/(?<!')-threads,(?!')/g, "'-threads', /Mobi|Android/i.test(navigator.userAgent) ? '1' : '4',");

  if (c !== fs.readFileSync(p, 'utf8')) {
    fs.writeFileSync(p, c);
    console.log('Fixed threads syntax in ' + file);
  }
}
