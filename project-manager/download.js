const https = require('https');
const fs = require('fs');

const url = 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Spacetoon.png';
const dest = 'public/spacetoon-logo.png';

const options = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://commons.wikimedia.org/',
    }
};

const file = fs.createWriteStream(dest);
https.get(url, options, (response) => {
    if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        // Handle redirect
        https.get(response.headers.location, options, (redirectRes) => {
            redirectRes.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log('Download complete via redirect.');
            });
        });
    } else {
        response.pipe(file);
        file.on('finish', () => {
            file.close();
            console.log('Download complete.');
        });
    }
}).on('error', (err) => {
    fs.unlink(dest, () => { });
    console.error('Error downloading:', err.message);
});
