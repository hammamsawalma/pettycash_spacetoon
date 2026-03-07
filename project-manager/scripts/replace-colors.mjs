import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

let count = 0;
walkDir('./src', function (filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.css')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let original = content;

        // Replace hex codes (case insensitive)
        content = content.replace(/#7F56D9/gi, '#102550');
        content = content.replace(/#6941C6/gi, '#1a3a7c');

        // Replace Tailwind purple classes with blue equivalents to match the Spacetoon blue theme
        content = content.replace(/purple-50/g, 'blue-50');
        content = content.replace(/purple-100/g, 'blue-100');
        content = content.replace(/purple-200/g, 'blue-200');
        content = content.replace(/purple-300/g, 'blue-300');
        content = content.replace(/purple-400/g, 'blue-400');
        content = content.replace(/purple-500/g, 'blue-500');
        content = content.replace(/purple-600/g, 'blue-600');
        content = content.replace(/purple-700/g, 'blue-700');
        content = content.replace(/purple-800/g, 'blue-800');
        content = content.replace(/purple-900/g, 'blue-900');

        if (content !== original) {
            fs.writeFileSync(filePath, content, 'utf8');
            count++;
        }
    }
});

console.log(`Updated ${count} files.`);
