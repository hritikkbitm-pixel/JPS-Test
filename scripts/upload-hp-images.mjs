/**
 * HP Laptop Cloudinary Upload Script
 * 
 * Uploads HP laptop images to Cloudinary with:
 * - folder = "Laptop/HP"
 * - public_id = filename (without extension)
 * 
 * Then updates the HP Laptop CSV with image URLs mapped by "Part no." column
 */

import { config } from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import { readdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config({ path: path.join(__dirname, "../.env") });

// Cloudinary credentials (fallback if .env doesn't load)
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "dvleiqhbw";
const API_KEY = process.env.CLOUDINARY_API_KEY || "275249716449581";
const API_SECRET = process.env.CLOUDINARY_API_SECRET || "e-uq6Kqf8l7I37TzTPiqKXNi_IY";

// Configure Cloudinary
cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
    secure: true,
});

// Configuration
const IMAGES_DIR = path.join(__dirname, "../img/HP Lap IMG/BulkResizePhotos.com (5)");
const CSV_FILE = path.join(__dirname, "../untitled folder/HP Laptop_priced.csv");
const CLOUDINARY_FOLDER = "Laptop/HP";
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v1/${CLOUDINARY_FOLDER}`;

// Supported extensions
const SUPPORTED_EXTENSIONS = [".webp", ".jpg", ".jpeg", ".png"];

/**
 * Upload a single image to Cloudinary
 */
async function uploadImage(filePath, filename) {
    const baseName = path.basename(filename, path.extname(filename));
    const publicId = `${CLOUDINARY_FOLDER}/${baseName}`;

    try {
        const result = await cloudinary.uploader.upload(filePath, {
            public_id: publicId,
            overwrite: true,
            resource_type: "image",
            unique_filename: false,
            use_filename: false,
        });

        return {
            success: true,
            filename,
            baseName,
            publicId: result.public_id,
            url: result.secure_url,
        };
    } catch (error) {
        return {
            success: false,
            filename,
            baseName,
            error: error.message,
        };
    }
}

/**
 * Main function
 */
async function main() {
    console.log("=".repeat(70));
    console.log("HP Laptop Image Upload to Cloudinary");
    console.log("=".repeat(70));
    console.log(`\nSource Directory: ${IMAGES_DIR}`);
    console.log(`CSV File: ${CSV_FILE}`);
    console.log(`Cloudinary Folder: ${CLOUDINARY_FOLDER}`);
    console.log(`Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
    console.log("\n");

    // Validate Cloudinary config
    if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
        console.error("❌ Error: Missing Cloudinary credentials");
        process.exit(1);
    }

    // Read images directory
    let files;
    try {
        files = await readdir(IMAGES_DIR);
    } catch (error) {
        console.error(`❌ Error reading directory: ${error.message}`);
        process.exit(1);
    }

    // Filter image files
    const imageFiles = files.filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return SUPPORTED_EXTENSIONS.includes(ext);
    });

    console.log(`Found ${imageFiles.length} image files to upload\n`);

    if (imageFiles.length === 0) {
        console.log("No images to upload. Exiting.");
        return;
    }

    // Build a map of baseName -> URL (will be populated after upload)
    const imageUrlMap = {};

    // Upload each image
    const results = { successful: [], failed: [] };

    for (let i = 0; i < imageFiles.length; i++) {
        const filename = imageFiles[i];
        const filePath = path.join(IMAGES_DIR, filename);
        const progress = `[${i + 1}/${imageFiles.length}]`;

        process.stdout.write(`${progress} Uploading ${filename}... `);

        const result = await uploadImage(filePath, filename);

        if (result.success) {
            console.log(`✅ Done`);
            results.successful.push(result);
            imageUrlMap[result.baseName] = result.url;
        } else {
            console.log(`❌ Failed: ${result.error}`);
            results.failed.push(result);
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Print upload summary
    console.log("\n" + "=".repeat(70));
    console.log("UPLOAD SUMMARY");
    console.log("=".repeat(70));
    console.log(`✅ Successful: ${results.successful.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);

    // Now update the CSV with image URLs
    console.log("\n" + "=".repeat(70));
    console.log("UPDATING CSV WITH IMAGE URLS");
    console.log("=".repeat(70));

    try {
        const csvContent = await readFile(CSV_FILE, "utf-8");
        const records = parse(csvContent, {
            columns: true,
            skip_empty_lines: true,
            relax_column_count: true
        });

        let matchedCount = 0;
        let unmatchedCount = 0;

        // For each record, check if image exists by Model name
        for (const record of records) {
            const model = record["Model"]?.trim();

            // Try to find matching image by model name
            let imageUrl = null;

            // Check all uploaded images for a match
            for (const [baseName, url] of Object.entries(imageUrlMap)) {
                // Direct match with model name
                if (model && baseName.trim() === model.trim()) {
                    imageUrl = url;
                    break;
                }
                // Also try matching with normalized whitespace
                if (model && baseName.replace(/\s+/g, ' ').trim() === model.replace(/\s+/g, ' ').trim()) {
                    imageUrl = url;
                    break;
                }
            }

            if (imageUrl) {
                record["Image"] = imageUrl;
                matchedCount++;
            } else {
                unmatchedCount++;
            }
        }

        // Get headers from first record
        const headers = Object.keys(records[0]);

        // Write updated CSV
        const output = stringify(records, { header: true, columns: headers });
        await writeFile(CSV_FILE, output);

        console.log(`\n✅ CSV Updated: ${matchedCount} images mapped`);
        console.log(`⚠️ Unmatched: ${unmatchedCount} records without images`);

    } catch (error) {
        console.error(`❌ Error updating CSV: ${error.message}`);
    }

    console.log("\n" + "=".repeat(70));
    console.log("Upload complete!");
    console.log("=".repeat(70));
}

main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
