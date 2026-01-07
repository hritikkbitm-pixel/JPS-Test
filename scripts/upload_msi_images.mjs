import { v2 as cloudinary } from "cloudinary";
import { readdir, readFile, writeFile } from "fs/promises";
import path from "path";

// Configuration
const CLOUD_NAME = "dvleiqhbw";
const API_KEY = "275249716449581";
const API_SECRET = "e-uq6Kqf8l7I37TzTPiqKXNi_IY";
const IMAGE_DIRS = [
    "/Users/Hritik/Desktop/JPS-Test/MSI/MSI-conv",
    "/Users/Hritik/Desktop/JPS-Test/MSI/MSI-psu"
];
const MSI_DIR = "/Users/Hritik/Desktop/JPS-Test/MSI";
const CLOUDINARY_FOLDER = "MSI";

// Configure Cloudinary
cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
    secure: true,
});

async function main() {
    console.log("🚀 Starting MSI image upload process...");

    const mapping = {}; // Map of normalized name to URL

    // 1. Read and Upload Images from all directories
    for (const imagesDir of IMAGE_DIRS) {
        console.log(`📁 Reading images from ${path.basename(imagesDir)}...`);
        try {
            const files = await readdir(imagesDir);
            const imageFiles = files.filter(f => f.toLowerCase().endsWith(".webp"));

            console.log(`📸 Found ${imageFiles.length} images.`);

            for (const filename of imageFiles) {
                const filePath = path.join(imagesDir, filename);
                let baseName = path.basename(filename, path.extname(filename));
                // Use decodeURIComponent for filenames like "SATA 2.5%22 240GB"
                baseName = decodeURIComponent(baseName).trim();

                console.log(`📤 Uploading image: ${filename} (as ${baseName})...`);
                try {
                    const result = await cloudinary.uploader.upload(filePath, {
                        folder: CLOUDINARY_FOLDER,
                        use_filename: true,
                        unique_filename: false,
                        overwrite: true,
                        resource_type: "image"
                    });

                    console.log(`✅ Uploaded: ${result.secure_url}`);
                    mapping[baseName.toLowerCase()] = result.secure_url;
                } catch (error) {
                    console.error(`❌ Failed to upload ${filename}:`, error.message);
                }
            }
        } catch (err) {
            console.error(`⚠️ Could not read directory ${imagesDir}:`, err.message);
        }
    }

    // 2. Update CSVs
    const csvFiles = [
        "msi-ssd.csv", "msi-monitor.csv", "msi-gpu.csv",
        "msi-cabinet.csv", "msi-psu.csv", "msi-cooler.csv",
        "msi-motherboard.csv"
    ];

    console.log("\n📝 Updating CSV files...");

    for (const csvFile of csvFiles) {
        const csvPath = path.join(MSI_DIR, csvFile);
        console.log(`🔍 Processing ${csvFile}...`);
        let csvContent = await readFile(csvPath, "utf-8");
        const rows = csvContent.split("\n").filter(r => r.trim() !== "");

        const header = rows[0].split(",");
        let nameIdx = header.indexOf("name");
        let imageIdx = header.indexOf("image");

        const newHeader = [...header];
        let isNewColumn = false;
        if (imageIdx === -1) {
            imageIdx = 3; // id, name, brand, image
            newHeader.splice(imageIdx, 0, "image");
            isNewColumn = true;
        }

        const updatedRows = [];
        let matchCount = 0;

        for (let i = 1; i < rows.length; i++) {
            const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
            const cols = rows[i].split(regex);

            if (cols.length <= nameIdx) continue;

            // Unquote and normalize CSV name
            let productName = cols[nameIdx].replace(/^"|"$/g, "").replace(/""/g, '"').trim();
            const lowerName = productName.toLowerCase();

            let imageUrl = mapping[lowerName] || "";

            // Fuzzy match if direct fails
            if (!imageUrl) {
                // Try if image name contains CSV name or vice versa
                const fuzzyMatchKey = Object.keys(mapping).find(imgName =>
                    imgName.includes(lowerName) || lowerName.includes(imgName)
                );

                if (fuzzyMatchKey) {
                    imageUrl = mapping[fuzzyMatchKey];
                }
            }

            if (imageUrl) {
                matchCount++;
            } else {
                console.log(`⚠️  No match for CSV product: [${productName}]`);
            }

            const newCols = [...cols];
            if (isNewColumn) {
                newCols.splice(imageIdx, 0, imageUrl);
            } else {
                newCols[imageIdx] = imageUrl;
            }

            const formattedRow = newCols.map(c => {
                const clean = c.replace(/^"|"$/g, "").replace(/""/g, '"');
                if (clean.includes(",") || clean.includes('"')) {
                    return `"${clean.replace(/"/g, '""')}"`;
                }
                return clean;
            }).join(",");

            updatedRows.push(formattedRow);
        }

        const finalCsvContent = [newHeader.join(","), ...updatedRows].join("\n");
        await writeFile(csvPath, finalCsvContent, "utf-8");
        console.log(`📊 ${csvFile}: Updated ${matchCount}/${updatedRows.length} products.`);
    }

    console.log("\n✨ All operations completed successfully!");
}

main().catch(console.error);
