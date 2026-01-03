/**
 * Cloudinary Bulk Upload Script
 * 
 * Uploads local product images to Cloudinary with:
 * - public_id = filename (MTM)
 * - upload_preset = "Main"
 * - folder = "Laptop/Lenovo"
 * - overwrite = true
 */

import { config } from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import { readdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config({ path: path.join(__dirname, "../.env") });

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

// Configuration
const IMAGES_DIR = path.join(__dirname, "../BulkResizePhotos.com (3)");
const CLOUDINARY_FOLDER = "Laptop/Lenovo";
const UPLOAD_PRESET = "Main";

// Supported image extensions
const SUPPORTED_EXTENSIONS = [".webp", ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff"];

/**
 * Extract SKU (public_id) from filename
 * e.g., "82R900HFIN.webp" -> "82R900HFIN"
 * e.g., "82Y0004RIN.1.webp" -> "82Y0004RIN.1"
 */
function extractSKU(filename) {
    const ext = path.extname(filename).toLowerCase();
    return path.basename(filename, ext);
}

/**
 * Upload a single image to Cloudinary
 */
async function uploadImage(filePath, filename) {
    const sku = extractSKU(filename);
    const publicId = `${CLOUDINARY_FOLDER}/${sku}`;

    try {
        const result = await cloudinary.uploader.upload(filePath, {
            public_id: publicId,
            upload_preset: UPLOAD_PRESET,
            overwrite: true,
            resource_type: "image",
            // Ensure no random suffix is added
            unique_filename: false,
            use_filename: false,
        });

        return {
            success: true,
            filename,
            sku,
            publicId: result.public_id,
            url: result.secure_url,
        };
    } catch (error) {
        return {
            success: false,
            filename,
            sku,
            error: error.message,
        };
    }
}

/**
 * Main function to upload all images
 */
async function main() {
    console.log("=".repeat(60));
    console.log("Cloudinary Bulk Upload Script");
    console.log("=".repeat(60));
    console.log(`\nSource Directory: ${IMAGES_DIR}`);
    console.log(`Cloudinary Folder: ${CLOUDINARY_FOLDER}`);
    console.log(`Upload Preset: ${UPLOAD_PRESET}`);
    console.log(`Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
    console.log("\n");

    // Validate Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        console.error("❌ Error: Missing Cloudinary credentials in .env file");
        console.error("Required environment variables:");
        console.error("  - CLOUDINARY_CLOUD_NAME");
        console.error("  - CLOUDINARY_API_KEY");
        console.error("  - CLOUDINARY_API_SECRET");
        process.exit(1);
    }

    // Read all files from the images directory
    let files;
    try {
        files = await readdir(IMAGES_DIR);
    } catch (error) {
        console.error(`❌ Error reading directory: ${error.message}`);
        process.exit(1);
    }

    // Filter for supported image files
    const imageFiles = files.filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return SUPPORTED_EXTENSIONS.includes(ext);
    });

    console.log(`Found ${imageFiles.length} image files to upload\n`);

    if (imageFiles.length === 0) {
        console.log("No images to upload. Exiting.");
        return;
    }

    // Track results
    const results = {
        successful: [],
        failed: [],
    };

    // Upload each image
    for (let i = 0; i < imageFiles.length; i++) {
        const filename = imageFiles[i];
        const filePath = path.join(IMAGES_DIR, filename);
        const progress = `[${i + 1}/${imageFiles.length}]`;

        process.stdout.write(`${progress} Uploading ${filename}... `);

        const result = await uploadImage(filePath, filename);

        if (result.success) {
            console.log(`✅ Done (${result.publicId})`);
            results.successful.push(result);
        } else {
            console.log(`❌ Failed: ${result.error}`);
            results.failed.push(result);
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log("UPLOAD SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ Successful: ${results.successful.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    console.log(`📁 Total: ${imageFiles.length}`);

    if (results.failed.length > 0) {
        console.log("\nFailed uploads:");
        results.failed.forEach((f) => {
            console.log(`  - ${f.filename}: ${f.error}`);
        });
    }

    console.log("\n" + "=".repeat(60));
    console.log("Upload complete!");
    console.log("=".repeat(60));
}

// Run the script
main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
