import { v2 as cloudinary } from "cloudinary";
import { readdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Configuration
const CLOUD_NAME = "dvleiqhbw";
const API_KEY = "275249716449581";
const API_SECRET = "e-uq6Kqf8l7I37TzTPiqKXNi_IY";
const IMAGES_DIR = "/Users/Hritik/Desktop/JPS-Test/img/BulkResizePhotos.com (4)";
const CSV_PATH = "/Users/Hritik/Desktop/JPS-Test/monitor_prices_processed.csv";
const CLOUDINARY_FOLDER = "Monitor";
const UPLOAD_PRESET = "Main"; // Assuming same preset exists, otherwise will fail. Alternatively use signed upload.

// Configure Cloudinary
cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
    secure: true,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    console.log("Starting upload process...");

    // 1. Read CSV
    console.log("Reading CSV...");
    let csvData = await readFile(CSV_PATH, "utf-8");
    const rows = csvData.split("\n");
    const header = rows[0];
    const dataRows = rows.slice(1).filter(r => r.trim() !== "");

    // Parse CSV to objects for easier manipulation
    let products = dataRows.map(row => {
        // Assuming simple CSV structure, but beware of commas in strings.
        // The previous script generated clean CSV with quotes if needed, but simple split might fail if description has commas.
        // However, python pandas usually quotes fields.
        // We will try regex split to handle quotes
        const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
        const cols = row.split(regex);
        return {
            row_raw: row,
            product_name: cols[0],
            price: cols[1],
            image: cols[2],
            category: cols[3],
            brand: cols[4],
            model: cols[5],
            description: cols[6],
            stock: cols[7]
        };
    });

    // 2. Read Images
    console.log("Reading images...");
    const files = await readdir(IMAGES_DIR);
    const imageFiles = files.filter(f => f.toLowerCase().endsWith(".webp"));

    console.log(`Found ${imageFiles.length} images.`);

    // 3. Upload and Map
    for (const filename of imageFiles) {
        const model = path.basename(filename, path.extname(filename)); // e.g. EW2790U
        const filePath = path.join(IMAGES_DIR, filename);

        // Find matching product in CSV (Model column index 5)
        const productIndex = products.findIndex(p => {
            // Clean up quotes if present
            const pModel = p.model ? p.model.replace(/"/g, "") : "";
            return pModel.trim() === model.trim();
        });

        if (productIndex !== -1) {
            console.log(`Uploading ${filename} for model ${model}...`);
            try {
                const result = await cloudinary.uploader.upload(filePath, {
                    folder: CLOUDINARY_FOLDER,
                    public_id: model,
                    overwrite: true,
                    resource_type: "image"
                });

                console.log(`✅ Uploaded: ${result.secure_url}`);
                products[productIndex].image = result.secure_url;
            } catch (error) {
                console.error(`❌ Failed to upload ${filename}:`, error.message);
            }
        } else {
            console.log(`⚠️ No CSV match for image ${filename} (Model: ${model})`);
        }
    }

    // 4. Write CSV back
    console.log("Updating CSV...");
    const newRows = products.map(p => {
        // Reconstruct CSV row
        // Helper to quote matching python pandas output
        const q = (s) => s; // Already quoted or structured from split? 
        // Actually, simple reconstruction:
        return [
            p.product_name,
            p.price,
            p.image, // New URL
            p.category,
            p.brand,
            p.model,
            p.description,
            p.stock
        ].join(",");
    });

    const newCsvContent = [header, ...newRows].join("\n");
    await writeFile(CSV_PATH, newCsvContent, "utf-8");

    console.log("Done! CSV updated.");
}

main().catch(console.error);
