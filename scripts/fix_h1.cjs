const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const dirs = fs.readdirSync(rootDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && 
            !['node_modules', 'dist', 'src', 'scripts', '.git', 'public'].includes(dirent.name))
    .map(dirent => dirent.name);

let updated = 0;

for (const dir of dirs) {
    const indexPath = path.join(rootDir, dir, 'index.html');
    if (!fs.existsSync(indexPath)) continue;
    if (dir === 'crop') continue; // already has h1

    let content = fs.readFileSync(indexPath, 'utf8');
    
    // Check if it already has an h1
    if (content.includes('<h1')) {
        console.log(`Skipping ${dir} - already has h1`);
        continue;
    }

    // Replace the first <h2> inside <article class="seo-content">
    // Some use <article>, some might use <section>
    // Just find `<article class="seo-content">` and replace the first <h2> after it.
    let searchTag = '<article class="seo-content">';
    if (!content.includes(searchTag)) {
        searchTag = '<section class="seo-content">';
    }

    if (content.includes(searchTag)) {
        const parts = content.split(searchTag);
        // Replace ONLY the first <h2> in parts[1]
        parts[1] = parts[1].replace(/<h2>(.*?)<\/h2>/, '<h1 class="seo-content__title">$1</h1>');
        content = parts.join(searchTag);
        
        fs.writeFileSync(indexPath, content, 'utf8');
        console.log(`Updated ${dir}`);
        updated++;
    } else {
        console.log(`Could not find seo-content in ${dir}`);
    }
}

console.log(`Finished. Updated ${updated} files.`);
