import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, 'uploads');
const PORT = 3456;

async function processBatch() {
    const files = fs.readdirSync(uploadsDir)
        .filter(file => !file.startsWith('.'))
        .map(file => ({
            filename: file,
            originalName: file, // Using filename as originalName for simplicity in script
            id: path.parse(file).name
        }));

    console.log(`Processing ${files.length} files...`);

    const payload = {
        files: files,
        settings: {
            outputFormat: 'webp',
            width: 450,
            height: 450,
            quality: 40,
            fitMode: 'contain',
            background: '#ffffff',
            upscale: true
        }
    };

    try {
        const response = await fetch(`http://localhost:${PORT}/api/process`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (data.success) {
            console.log('SUCCESS!');
            console.log('Session ID:', data.sessionId);
            console.log('Download all link:', `http://localhost:3456/api/download-all/${data.sessionId}`);
        } else {
            console.error('FAILED:', data.error);
        }
    } catch (err) {
        console.error('ERROR:', err.message);
    }
}

processBatch();
