const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.js'));

for (const file of files) {
    const filePath = path.join(srcDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove the literal backslashes
    content = content.replace(/\\`/g, '`');
    content = content.replace(/\\\$/g, '$');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed ${file}`);
}
