import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
config({ path: path.join(__dirname, '../.env') });

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dvleiqhbw",
    api_key: process.env.CLOUDINARY_API_KEY || "275249716449581",
    api_secret: process.env.CLOUDINARY_API_SECRET || "e-uq6Kqf8l7I37TzTPiqKXNi_IY",
    secure: true,
});

const IMAGES_DIR = path.join(__dirname, '../img/logiconvert');
const CSV_DIR = path.join(__dirname, '../logitech');
const CLOUDINARY_FOLDER = 'Logitech/Products';

/**
 * Normalizes text for matching.
 * Handles character encoding artifacts and special symbols.
 */
function normalize(text) {
    if (!text) return '';
    return text
        .toLowerCase()
        .replace(/®|™|©/g, '')
        // Clean up common encoding artifacts
        .replace(/â¬ã†/g, '') // Corrupted Registered Symbol
        .replace(/â€šǹìƒâ¢/g, '') // Corrupted Trademark Symbol
        .replace(/â‚¬/g, '')     // Other artifacts
        .replace(/n:a/g, 'n/a')   // Handle N:A vs N/A
        .replace(/[^a-z0-9]/g, ' ') // Replace all non-alphanumeric with space
        .replace(/\s+/g, '')       // Remove all spaces
        .trim();
}

/**
 * Parses a single CSV line into an array of values.
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

/**
 * Escapes a value for CSV.
 */
function escapeCSV(value) {
    if (value === undefined || value === null) return '';
    let str = String(value).replace(/[\r\n]+/g, ' ').trim();
    if (str.includes(',') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

async function main() {
    console.log('🚀 Starting Logitech Image Upload & Mapping\n');

    if (!fs.existsSync(IMAGES_DIR)) {
        console.error('❌ Images directory not found:', IMAGES_DIR);
        process.exit(1);
    }

    // 1. Get all images and their normalized names
    const imageFiles = fs.readdirSync(IMAGES_DIR).filter(f => f.endsWith('.webp'));
    console.log(`📸 Found ${imageFiles.length} images to upload.`);

    const imageMap = new Map(); // normalizedName -> cloudinaryUrl

    // 2. Upload images to Cloudinary
    for (let i = 0; i < imageFiles.length; i++) {
        const filename = imageFiles[i];
        const filePath = path.join(IMAGES_DIR, filename);
        const baseName = path.basename(filename, '.webp');
        const normalizedName = normalize(baseName);

        console.log(`[${i + 1}/${imageFiles.length}] Uploading: ${filename}`);

        try {
            const result = await cloudinary.uploader.upload(filePath, {
                folder: CLOUDINARY_FOLDER,
                use_filename: true,
                unique_filename: false,
                overwrite: true,
            });

            imageMap.set(normalizedName, result.secure_url);
        } catch (error) {
            console.error(`  ❌ Error uploading ${filename}:`, error.message);
        }
    }

    console.log('\n✅ Upload complete. Starting mapping...\n');

    // 3. Process each CSV file
    const csvFiles = fs.readdirSync(CSV_DIR).filter(f => f.endsWith('.csv'));
    let totalMapped = 0;
    let totalUnmapped = 0;

    for (const csvFile of csvFiles) {
        const filePath = path.join(CSV_DIR, csvFile);
        console.log(`📄 Processing CSV: ${csvFile}`);

        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        if (lines.length < 1) continue;

        const headers = parseCSVLine(lines[0]);
        const productNameIdx = headers.indexOf('Product Name');
        const imageIdx = headers.indexOf('Image');

        if (productNameIdx === -1) {
            console.error(`  ❌ "Product Name" column not found in ${csvFile}`);
            continue;
        }
        if (imageIdx === -1) {
            console.error(`  ❌ "Image" column not found in ${csvFile}. Run add-image-column script first.`);
            continue;
        }

        const newLines = [lines[0]];
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;

            const values = parseCSVLine(lines[i]);
            const productName = values[productNameIdx];
            const normalizedProductName = normalize(productName);

            const imageUrl = imageMap.get(normalizedProductName);
            if (imageUrl) {
                values[imageIdx] = imageUrl;
                totalMapped++;
            } else {
                totalUnmapped++;
                // Optional: debug mismatch
                // console.log(`  🔍 Could not find image for: ${productName} (normalized: ${normalizedProductName})`);
            }

            newLines.push(values.map(escapeCSV).join(','));
        }

        fs.writeFileSync(filePath, newLines.join('\n'));
    }

    console.log('\n' + '='.repeat(40));
    console.log('SUMMARY');
    console.log('='.repeat(40));
    console.log(`✅ Successfully mapped: ${totalMapped}`);
    console.log(`⚠️  Products without images: ${totalUnmapped}`);
    console.log('='.repeat(40));
}

main().catch(console.error);
