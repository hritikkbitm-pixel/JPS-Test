import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dir = path.join(__dirname, '../logitech');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.csv'));

files.forEach(file => {
    const filePath = path.join(dir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    // Add 'Image' column to header if not exists
    if (!lines[0].includes(',Image')) {
        lines[0] = lines[0] + ',Image';
        // Add empty value for each row
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                lines[i] = lines[i] + ',';
            }
        }
        fs.writeFileSync(filePath, lines.join('\n'));
        console.log('✅ Added Image column to:', file);
    } else {
        console.log('⏭️  Image column already exists in:', file);
    }
});
console.log('\n🎉 Done!');
