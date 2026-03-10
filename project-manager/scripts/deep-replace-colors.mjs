import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walkDir(dirPath, callback);
        } else {
            callback(path.join(dir, f));
        }
    });
}

function processContent(content) {
    let original = content;

    // 1. Tailwind generic purple/indigo/violet classes to blue
    content = content.replace(/\b(bg|text|border|ring|shadow|from|to|via|fill|stroke|hover:bg|hover:text|hover:border|focus:ring)-purple-([a-zA-Z0-9\[\]/#]+)/g, '$1-blue-$2');
    content = content.replace(/\b(bg|text|border|ring|shadow|from|to|via|fill|stroke|hover:bg|hover:text|hover:border|focus:ring)-indigo-([a-zA-Z0-9\[\]/#]+)/g, '$1-blue-$2');
    content = content.replace(/\b(bg|text|border|ring|shadow|from|to|via|fill|stroke|hover:bg|hover:text|hover:border|focus:ring)-violet-([a-zA-Z0-9\[\]/#]+)/g, '$1-blue-$2');
    content = content.replace(/\bpurple-([a-zA-Z0-9]+)\b/g, 'blue-$1'); // Catch-all for basic cases like purple-50

    // 2. Specific Hex Colors
    // Light purples to light blues
    content = content.replace(/#F9F5FF/gi, '#F0F5FF'); // Lightest
    content = content.replace(/#F4EBFF/gi, '#E0E7FF');
    content = content.replace(/#E9D7FE/gi, '#C7D2FE');
    content = content.replace(/#D6BBFB/gi, '#A5B4FC');

    // Mid purples to mid blues
    content = content.replace(/#B692F6/gi, '#818CF8');
    content = content.replace(/#9E77ED/gi, '#6366F1');

    // Primary purples to Spacetoon primary blue (#102550)
    content = content.replace(/#7F56D9/gi, '#102550');
    content = content.replace(/#6941C6/gi, '#1a3a7c'); // hover

    // Dark purples to dark blues
    content = content.replace(/#53389E/gi, '#122b5e');
    content = content.replace(/#42307D/gi, '#0e2148');
    content = content.replace(/#3E1C96/gi, '#0a1733');

    return { content, changed: original !== content };
}

let count = 0;
walkDir('./src', function (filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.css') || filePath.endsWith('.json')) {
        let raw = fs.readFileSync(filePath, 'utf8');
        let { content, changed } = processContent(raw);

        if (changed) {
            fs.writeFileSync(filePath, content, 'utf8');
            count++;
        }
    }
});

console.log(`Deep color clean completed. Updated ${count} files.`);
