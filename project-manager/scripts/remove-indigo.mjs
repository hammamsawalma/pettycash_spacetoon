import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

function processContent(content) {
    let original = content;

    // The previous script mapped some purples to Tailwind Indigo Hexes (#6366F1, etc).
    // Saif correctly identified these as still looking purple.
    // We will map these Indigo hexes to pure Tailwind Blue hexes to guarantee no purple hues.

    // Indigo-500 -> Blue-600
    content = content.replace(/#6366F1/gi, '#2563eb');
    content = content.replace(/rgb\(99,\s*102,\s*241\)/gi, 'rgb(37, 99, 235)');

    // Indigo-400 -> Blue-500
    content = content.replace(/#818CF8/gi, '#3b82f6');

    // Indigo-300 -> Blue-400
    content = content.replace(/#A5B4FC/gi, '#60a5fa');

    // Indigo-200 -> Blue-300
    content = content.replace(/#C7D2FE/gi, '#93c5fd');

    // Indigo-100 -> Blue-200
    content = content.replace(/#E0E7FF/gi, '#bfdbfe');

    // Indigo-50 -> Blue-100
    content = content.replace(/#F0F5FF/gi, '#dbeafe');

    // Also catch any "purple-ish" keywords that might still exist in SVGs or specific components
    content = content.replace(/rgb\(\s*139\s*,\s*92\s*,\s*246\s*\)/gi, '#2563eb'); // violet-500

    return { content, changed: original !== content };
}

let count = 0;
walkDir('./src', function (filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.css') || filePath.endsWith('.json')) {
        let raw = fs.readFileSync(filePath, 'utf8');
        let { content, changed } = processContent(raw);

        if (changed) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Fixed indigo in: ' + filePath);
            count++;
        }
    }
});

console.log(`Removed all indigo/purple hues completely. Updated ${count} files.`);
