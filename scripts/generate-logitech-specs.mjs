import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Parse CSV content
function parseCSV(content) {
    const lines = content.split('\n');
    const headers = parseCSVLine(lines[0]);
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
            const values = parseCSVLine(lines[i]);
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            rows.push(row);
        }
    }

    return { headers, rows };
}

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

function toCSV(headers, rows) {
    const lines = [headers.map(escapeCSV).join(',')];
    rows.forEach(row => {
        const values = headers.map(header => escapeCSV(row[header] || ''));
        lines.push(values.join(','));
    });
    return lines.join('\n');
}

function escapeCSV(value) {
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

// Extract model name from product name for searching
function extractModelName(productName) {
    // Remove region/color codes like "- GRAPHITE - US - APANZ-122"
    let cleaned = productName
        .replace(/\s*-\s*(GRAPHITE|BLACK|WHITE|GREY|GRAY|BLUE|ROSE|PINK|SAND|LILAC|OFF-WHITE|PALE GREY|DARK ROSE|OXFORD GREY|VIVID RED|CHARTREUSE|TONAL|MID GREY|DARKER ROSE|LAVENDER|SILVER|N\/A)\s*/gi, ' ')
        .replace(/\s*-\s*(US|IND|APANZ|AMR|AP|LATA|TWKOR|AMR\+AP|APANZ-\d+|AMR-\d+|LATA-\d+|TWKOR-\d+|WW-\d+)\s*-?/gi, ' ')
        .replace(/\s*-\s*\d+\s*$/g, '') // Remove trailing numbers with dash
        .replace(/\s+/g, ' ')
        .trim();

    // Extract the main model identifier
    // e.g., "Logitech MX Master 3S" from full name
    return cleaned;
}

// Search Logitech website and scrape product info
async function scrapeLogitechProduct(productName, category) {
    const modelName = extractModelName(productName);
    const searchQuery = encodeURIComponent(modelName);

    try {
        // First, search on Logitech website
        const searchUrl = `https://www.logitech.com/en-in/search?q=${searchQuery}`;

        const searchResponse = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });

        if (!searchResponse.ok) {
            console.log(`    ⚠️ Search failed for: ${modelName.substring(0, 40)}`);
            return generateFallbackSpecs(productName, category);
        }

        const searchHtml = await searchResponse.text();
        const $search = cheerio.load(searchHtml);

        // Find product link from search results
        const productLink = $search('.product-tile a[href*="/products/"]').first().attr('href') ||
            $search('a[href*="/products/"]').first().attr('href');

        if (!productLink) {
            console.log(`    ⚠️ No product found for: ${modelName.substring(0, 40)}`);
            return generateFallbackSpecs(productName, category);
        }

        // Build full product URL
        const productUrl = productLink.startsWith('http') ? productLink : `https://www.logitech.com${productLink}`;

        // Fetch product page
        await delay(1000); // Rate limiting

        const productResponse = await fetch(productUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            }
        });

        if (!productResponse.ok) {
            console.log(`    ⚠️ Product page failed: ${productUrl.substring(0, 50)}`);
            return generateFallbackSpecs(productName, category);
        }

        const productHtml = await productResponse.text();
        const $ = cheerio.load(productHtml);

        // Extract features
        const features = [];
        $('[class*="feature"], [class*="benefit"], .key-features li, .product-features li, [data-testid*="feature"]').each((_, el) => {
            const text = $(el).text().trim();
            if (text && text.length > 5 && text.length < 200) {
                features.push(text);
            }
        });

        // Extract description
        let shortDesc = $('meta[name="description"]').attr('content') ||
            $('[class*="product-description"]').first().text().trim() ||
            $('[class*="short-description"]').first().text().trim();

        let longDesc = $('[class*="overview"]').first().text().trim() ||
            $('[class*="product-detail"]').first().text().trim() ||
            $('article').first().text().trim();

        // Clean up
        shortDesc = shortDesc?.substring(0, 150).trim() || '';
        longDesc = longDesc?.substring(0, 500).trim() || '';

        if (features.length === 0 && !shortDesc && !longDesc) {
            return generateFallbackSpecs(productName, category);
        }

        return {
            keyFeatures: features.slice(0, 6).join(' | ') || generateFallbackSpecs(productName, category).keyFeatures,
            shortDescription: shortDesc || generateFallbackSpecs(productName, category).shortDescription,
            longDescription: longDesc || generateFallbackSpecs(productName, category).longDescription
        };

    } catch (error) {
        console.log(`    ⚠️ Error scraping: ${error.message.substring(0, 50)}`);
        return generateFallbackSpecs(productName, category);
    }
}

// Generate fallback specs based on product name and category
function generateFallbackSpecs(productName, category) {
    const modelName = extractModelName(productName);

    // Category-specific feature templates
    const categoryFeatures = {
        'mouse': 'Precision tracking | Ergonomic design | Wireless connectivity | Long battery life | Multi-device support | Programmable buttons',
        'keyboard': 'Comfortable typing | Durable keys | Wireless connectivity | Long battery life | Multi-device support | Quiet operation',
        'headset': 'Clear audio | Noise cancellation | Comfortable fit | Built-in microphone | Long battery life | Wireless connectivity',
        'webcam': 'HD video quality | Clear audio | Auto-focus | Wide-angle lens | Easy setup | Universal compatibility',
        'combo': 'Keyboard and mouse bundle | Wireless connectivity | Long battery life | Comfortable design | Plug and play | Space-saving',
        'speaker': 'Rich audio quality | Deep bass | Clear highs | Easy connectivity | Compact design | Volume control',
        'presenter': 'Wireless control | Laser pointer | Long range | Easy navigation | USB receiver | Ergonomic design',
        'steering-wheel': 'Realistic force feedback | Responsive pedals | Premium build | Racing simulation | Wide compatibility | Adjustable settings',
        'gamepad': 'Precise controls | Comfortable grip | Wireless connectivity | Long battery life | Wide compatibility | Durable build',
        'joystick': 'Precise control | Multiple buttons | Comfortable grip | Flight simulation | Wide compatibility | Adjustable settings',
        'tablet-accessories': 'Perfect fit | Protective design | Enhanced productivity | Premium materials | Easy installation | Stylish look',
        'pointing-devices': 'Precision control | Ergonomic design | Smooth tracking | Comfortable use | Multi-device support | Durable build',
        'gaming-accessories': 'Gaming optimized | Premium quality | Enhanced performance | Durable design | RGB lighting | Wide compatibility'
    };

    const features = categoryFeatures[category] || categoryFeatures['mouse'];

    const shortDesc = `${modelName} - Premium Logitech ${category} designed for comfort and performance.`;

    const longDesc = `The ${modelName} is a high-quality ${category} from Logitech, built with precision engineering and user comfort in mind. Whether you're working from home, in the office, or gaming, this ${category} delivers exceptional performance and reliability. Features include advanced connectivity options, durable construction, and the trusted quality that Logitech is known for. Perfect for professionals and enthusiasts alike who demand the best from their peripherals.`;

    return {
        keyFeatures: features,
        shortDescription: shortDesc.substring(0, 150),
        longDescription: longDesc
    };
}

// Process a single CSV file
async function processCSVFile(filePath) {
    console.log(`\n📂 Processing: ${path.basename(filePath)}`);

    const content = fs.readFileSync(filePath, 'utf-8');
    const { headers, rows } = parseCSV(content);

    // Add new columns if they don't exist
    const newHeaders = [...headers];
    if (!newHeaders.includes('Key Features')) newHeaders.push('Key Features');
    if (!newHeaders.includes('Short Description')) newHeaders.push('Short Description');
    if (!newHeaders.includes('Long Description')) newHeaders.push('Long Description');

    // Get category from filename
    const category = path.basename(filePath, '.csv').replace('logitech-', '').replace(/-/g, ' ');

    let processed = 0;
    let generated = 0;
    const total = rows.length;

    for (const row of rows) {
        const productName = row['Product Name'];

        if (!productName) {
            processed++;
            continue;
        }

        // Skip if already has descriptions
        if (row['Key Features'] && row['Short Description'] && row['Long Description']) {
            console.log(`  ✓ [${processed + 1}/${total}] Already done: ${productName.substring(0, 40)}...`);
            processed++;
            continue;
        }

        console.log(`  🔄 [${processed + 1}/${total}] Processing: ${productName.substring(0, 50)}...`);

        const specs = await scrapeLogitechProduct(productName, category);

        row['Key Features'] = specs.keyFeatures;
        row['Short Description'] = specs.shortDescription;
        row['Long Description'] = specs.longDescription;
        generated++;

        processed++;

        // Save progress after each product
        const updatedCSV = toCSV(newHeaders, rows);
        fs.writeFileSync(filePath, updatedCSV);

        // Rate limiting
        if (processed < total) {
            await delay(2000);
        }
    }

    console.log(`  ✅ Completed: ${generated} specs generated for ${processed} products`);
}

// Main execution
async function main() {
    const logitechDir = path.join(__dirname, '../logitech');

    if (!fs.existsSync(logitechDir)) {
        console.error('❌ Logitech directory not found:', logitechDir);
        process.exit(1);
    }

    const csvFiles = fs.readdirSync(logitechDir)
        .filter(file => file.endsWith('.csv'))
        .map(file => path.join(logitechDir, file));

    console.log(`🚀 Found ${csvFiles.length} CSV files to process`);
    console.log(`🌐 Scraping Logitech website for product information...\n`);

    for (const file of csvFiles) {
        await processCSVFile(file);
    }

    console.log('\n🎉 All files processed successfully!');
}

main().catch(console.error);
