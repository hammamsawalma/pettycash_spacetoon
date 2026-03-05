const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

function processFile(filePath) {
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // Replace ar-SA with en-GB
    content = content.replace(/'ar-SA'/g, "'en-GB'");
    content = content.replace(/"ar-SA"/g, '"en-GB"');

    // Replace ر.س with ر.ق
    content = content.replace(/ر\.س/g, 'ر.ق');

    // Replace SAR with QAR
    content = content.replace(/\bSAR\b/g, 'QAR');

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated', filePath);
    }
}

['src', 'prisma'].forEach(dir => {
    if (fs.existsSync(dir)) {
        walkDir(dir, processFile);
    }
});
