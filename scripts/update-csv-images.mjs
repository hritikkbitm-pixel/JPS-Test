/**
 * Update CSV with Cloudinary Image URLs
 * 
 * Reads the Lenovo laptop CSV and updates the Image column
 * with Cloudinary URLs based on MTM values.
 */

import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CSV_PATH = path.join(__dirname, "../untitled folder/lenovo-all-laptop - Jan'26 Ch PL-Full (1).csv");
const OUTPUT_PATH = path.join(__dirname, "../untitled folder/lenovo-all-laptop - Jan'26 Ch PL-Full (1).csv");
const CLOUDINARY_BASE_URL = "https://res.cloudinary.com/dvleiqhbw/image/upload/v1/Laptop/Lenovo";

// Column indices (0-based)
const MTM_COLUMN = 3;  // Column D is MTM
const IMAGE_COLUMN = 24; // Last column is Image

/**
 * Parse CSV line handling quoted fields with commas
 */
function parseCSVLine(line) {
    const result = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = "";
        } else {
            current += char;
        }
    }
    result.push(current);

    return result;
}

/**
 * Convert array to CSV line
 */
function toCSVLine(fields) {
    return fields.map(field => {
        // If field contains comma, newline, or quote, wrap in quotes
        if (field && (field.includes(',') || field.includes('\n') || field.includes('"'))) {
            return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
    }).join(',');
}

/**
 * Main function
 */
function main() {
    console.log("=".repeat(60));
    console.log("Update CSV with Cloudinary Image URLs");
    console.log("=".repeat(60));
    console.log(`\nSource: ${CSV_PATH}`);
    console.log(`Output: ${OUTPUT_PATH}`);
    console.log(`Cloudinary Base: ${CLOUDINARY_BASE_URL}`);
    console.log("\n");

    // Read CSV file
    const csvContent = readFileSync(CSV_PATH, "utf-8");
    const lines = csvContent.split(/\r?\n/);

    console.log(`Total lines: ${lines.length}\n`);

    let updated = 0;
    let skipped = 0;

    const updatedLines = lines.map((line, index) => {
        // Skip header rows (first few rows without data)
        if (index < 3) {
            return line;
        }

        const fields = parseCSVLine(line);

        // Skip if not enough columns or no MTM
        if (fields.length <= MTM_COLUMN) {
            return line;
        }

        const mtm = fields[MTM_COLUMN]?.trim();

        // Skip if MTM is empty or is the header
        if (!mtm || mtm === "MTM" || mtm === "") {
            return line;
        }

        // Construct new Cloudinary URL
        const imageUrl = `${CLOUDINARY_BASE_URL}/${mtm}.webp`;

        // Ensure we have enough columns for the image
        while (fields.length <= IMAGE_COLUMN) {
            fields.push("");
        }

        const oldUrl = fields[IMAGE_COLUMN];
        fields[IMAGE_COLUMN] = imageUrl;

        if (oldUrl !== imageUrl) {
            updated++;
            console.log(`[${updated}] ${mtm} → ${imageUrl}`);
        } else {
            skipped++;
        }

        return toCSVLine(fields);
    });

    // Write updated CSV
    writeFileSync(OUTPUT_PATH, updatedLines.join("\r\n"), "utf-8");

    console.log("\n" + "=".repeat(60));
    console.log("SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ Updated: ${updated}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`📁 Output: ${OUTPUT_PATH}`);
    console.log("=".repeat(60));
}

main();
