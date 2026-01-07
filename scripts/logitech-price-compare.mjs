import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// User agent for web requests
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Fetch with timeout
async function fetchWithTimeout(url, options, timeout = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

// Extract clean search term from product name
function getSearchTerm(productName) {
    // Remove color/region codes
    let cleaned = productName
        .replace(/\s*-\s*(GRAPHITE|BLACK|WHITE|GREY|GRAY|BLUE|ROSE|PINK|SAND|LILAC|OFF-WHITE|PALE GREY|DARK ROSE|OXFORD GREY|VIVID RED|CHARTREUSE|TONAL|MID GREY|DARKER ROSE|LAVENDER|SILVER|N\/A)\s*/gi, ' ')
        .replace(/\s*-\s*(US|IND|APANZ|AMR|AP|LATA|TWKOR|AMR\+AP|APANZ-\d+|AMR-\d+|LATA-\d+|TWKOR-\d+|WW-\d+|USB|PLUGD|PLUGL)\s*-?/gi, ' ')
        .replace(/\s*-\s*\d+\s*$/g, '')
        .replace(/\s*M\/N:[A-Z0-9]+/gi, '')
        .replace(/\(Do Not Use\)/gi, '')
        .replace(/®|™/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    // Get first part before any remaining dashes
    const parts = cleaned.split(' - ');
    return parts[0].trim();
}

// Search Amazon India
async function searchAmazon(productName) {
    const searchTerm = getSearchTerm(productName);
    const url = `https://www.amazon.in/s?k=${encodeURIComponent('Logitech ' + searchTerm)}`;

    try {
        const response = await fetchWithTimeout(url, {
            headers: {
                'User-Agent': USER_AGENT,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-IN,en;q=0.9',
            }
        });

        if (!response.ok) return null;

        const html = await response.text();
        const $ = cheerio.load(html);

        // Find price from search results
        const priceText = $('[data-component-type="s-search-result"]').first()
            .find('.a-price-whole').first().text().replace(/,/g, '').trim();

        if (priceText && !isNaN(parseInt(priceText))) {
            return { source: 'Amazon', price: parseInt(priceText) };
        }
    } catch (error) {
        console.log(`    Amazon error: ${error.message.substring(0, 50)}`);
    }
    return null;
}

// Search Flipkart
async function searchFlipkart(productName) {
    const searchTerm = getSearchTerm(productName);
    const url = `https://www.flipkart.com/search?q=${encodeURIComponent('Logitech ' + searchTerm)}`;

    try {
        const response = await fetchWithTimeout(url, {
            headers: {
                'User-Agent': USER_AGENT,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            }
        });

        if (!response.ok) return null;

        const html = await response.text();
        const $ = cheerio.load(html);

        // Find price - Flipkart uses ₹ symbol
        const priceText = $('[class*="_30jeq3"]').first().text()
            .replace(/[₹,]/g, '').trim();

        if (priceText && !isNaN(parseInt(priceText))) {
            return { source: 'Flipkart', price: parseInt(priceText) };
        }
    } catch (error) {
        console.log(`    Flipkart error: ${error.message.substring(0, 50)}`);
    }
    return null;
}

// Search ElitesHub
async function searchElitesHub(productName) {
    const searchTerm = getSearchTerm(productName);
    const url = `https://elitehubs.com/search?q=${encodeURIComponent('Logitech ' + searchTerm)}`;

    try {
        const response = await fetchWithTimeout(url, {
            headers: {
                'User-Agent': USER_AGENT,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            }
        });

        if (!response.ok) return null;

        const html = await response.text();
        const $ = cheerio.load(html);

        // Find price
        const priceText = $('[class*="price"]').first().text()
            .replace(/[₹,Rs.]/gi, '').trim();

        const match = priceText.match(/(\d+)/);
        if (match) {
            return { source: 'ElitesHub', price: parseInt(match[1]) };
        }
    } catch (error) {
        console.log(`    ElitesHub error: ${error.message.substring(0, 50)}`);
    }
    return null;
}

// Search MD Computers
async function searchMDComputers(productName) {
    const searchTerm = getSearchTerm(productName);
    const url = `https://mdcomputers.in/index.php?route=product/search&search=${encodeURIComponent('Logitech ' + searchTerm)}`;

    try {
        const response = await fetchWithTimeout(url, {
            headers: {
                'User-Agent': USER_AGENT,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            }
        });

        if (!response.ok) return null;

        const html = await response.text();
        const $ = cheerio.load(html);

        // Find price
        const priceText = $('[class*="price-new"]').first().text()
            .replace(/[₹,Rs.]/gi, '').trim();

        const match = priceText.match(/(\d+)/);
        if (match) {
            return { source: 'MDComputers', price: parseInt(match[1]) };
        }
    } catch (error) {
        console.log(`    MDComputers error: ${error.message.substring(0, 50)}`);
    }
    return null;
}

// Search Vedant Computers
async function searchVedantComputers(productName) {
    const searchTerm = getSearchTerm(productName);
    const url = `https://www.vedantcomputers.com/index.php?route=product/search&search=${encodeURIComponent('Logitech ' + searchTerm)}`;

    try {
        const response = await fetchWithTimeout(url, {
            headers: {
                'User-Agent': USER_AGENT,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            }
        });

        if (!response.ok) return null;

        const html = await response.text();
        const $ = cheerio.load(html);

        // Find price
        const priceText = $('[class*="price-new"]').first().text()
            .replace(/[₹,Rs.]/gi, '').trim();

        const match = priceText.match(/(\d+)/);
        if (match) {
            return { source: 'VedantComputers', price: parseInt(match[1]) };
        }
    } catch (error) {
        console.log(`    VedantComputers error: ${error.message.substring(0, 50)}`);
    }
    return null;
}

// Get lowest price from all sources
async function getLowestOnlinePrice(productName) {
    console.log(`    🔍 Searching: ${getSearchTerm(productName).substring(0, 40)}...`);

    const results = await Promise.all([
        searchAmazon(productName),
        delay(500).then(() => searchFlipkart(productName)),
        delay(1000).then(() => searchElitesHub(productName)),
        delay(1500).then(() => searchMDComputers(productName)),
        delay(2000).then(() => searchVedantComputers(productName)),
    ]);

    const validPrices = results.filter(r => r && r.price > 0);

    if (validPrices.length === 0) {
        console.log(`    ❌ No prices found online`);
        return null;
    }

    // Sort by price and get lowest
    validPrices.sort((a, b) => a.price - b.price);
    const lowest = validPrices[0];

    console.log(`    ✅ Found ${validPrices.length} prices. Lowest: ₹${lowest.price} (${lowest.source})`);
    return lowest;
}

// Calculate final price based on rules
function calculateFinalPrice(msp, mrp, lowestOnlinePrice) {
    // If no online price found, use MSP + 2%
    if (!lowestOnlinePrice) {
        const fallbackPrice = Math.round(msp * 1.02);
        return { price: fallbackPrice, source: 'MSP+2%', undercut: false, note: 'No online price found' };
    }

    const onlinePrice = lowestOnlinePrice.price;

    // If MSP < lowest online price, we can undercut
    if (msp < onlinePrice) {
        // Undercut by ₹100-500 depending on price range, but stay above MSP
        let undercut;
        if (onlinePrice < 1000) {
            undercut = Math.max(50, Math.min(onlinePrice - msp - 10, 100));
        } else if (onlinePrice < 5000) {
            undercut = Math.max(100, Math.min(onlinePrice - msp - 50, 200));
        } else if (onlinePrice < 10000) {
            undercut = Math.max(200, Math.min(onlinePrice - msp - 100, 500));
        } else {
            undercut = Math.max(500, Math.min(onlinePrice - msp - 200, 1000));
        }

        const finalPrice = onlinePrice - undercut;

        // Ensure we stay above MSP
        if (finalPrice > msp) {
            return {
                price: Math.round(finalPrice),
                source: lowestOnlinePrice.source,
                lowestOnline: onlinePrice,
                undercut: true
            };
        }
    }

    // If we can't undercut (MSP >= online price), use MSP + 2%
    const fallbackPrice = Math.round(msp * 1.02);
    return {
        price: fallbackPrice,
        source: 'MSP+2%',
        lowestOnline: onlinePrice,
        undercut: false,
        note: 'MSP too high to undercut'
    };
}

// Parse CSV
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

function escapeCSV(value) {
    if (value === undefined || value === null) return '';
    let str = String(value).replace(/[\r\n]+/g, ' ').trim();
    if (str.includes(',') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

function toCSV(headers, rows) {
    const lines = [headers.map(escapeCSV).join(',')];
    rows.forEach(row => {
        const values = headers.map(header => escapeCSV(row[header] || ''));
        lines.push(values.join(','));
    });
    return lines.join('\n');
}

// Process a single CSV file
async function processCSVFile(filePath) {
    console.log(`\n📂 Processing: ${path.basename(filePath)}`);

    const content = fs.readFileSync(filePath, 'utf-8');
    const { headers, rows } = parseCSV(content);

    // Add new columns
    const newHeaders = [...headers];
    if (!newHeaders.includes('Final Price')) newHeaders.push('Final Price');
    if (!newHeaders.includes('Price Source')) newHeaders.push('Price Source');
    if (!newHeaders.includes('Lowest Online')) newHeaders.push('Lowest Online');
    if (!newHeaders.includes('Price Notes')) newHeaders.push('Price Notes');

    let processed = 0;
    const total = rows.length;

    for (const row of rows) {
        const productName = row['Product Name'];

        if (!productName) {
            processed++;
            continue;
        }

        // Skip if already has final price
        if (row['Final Price']) {
            console.log(`  ✓ [${processed + 1}/${total}] Already done: ${productName.substring(0, 40)}...`);
            processed++;
            continue;
        }

        console.log(`  🔄 [${processed + 1}/${total}] ${productName.substring(0, 50)}...`);

        // Get MSP (use Rashi or Supertron, whichever is available)
        let msp = parseFloat(row['MSP Rashi']) || parseFloat(row['MSP Supertron']) || 0;
        if (isNaN(msp) || msp === 0 || row['MSP Rashi'] === 'NA') {
            msp = parseFloat(row['MSP Supertron']) || 0;
        }

        // Get MRP
        let mrp = parseFloat(row['MRP Rashi']) || parseFloat(row['MRP Supertron']) || 0;
        if (isNaN(mrp) || mrp === 0 || row['MRP Rashi'] === 'NA') {
            mrp = parseFloat(row['MRP Supertron']) || 0;
        }

        // Handle NA values
        if (isNaN(msp)) msp = 0;
        if (isNaN(mrp)) mrp = 0;

        // Search for online prices
        const lowestOnline = await getLowestOnlinePrice(productName);

        // Calculate final price
        const result = calculateFinalPrice(msp, mrp, lowestOnline);

        row['Final Price'] = result.price;
        row['Price Source'] = result.source;
        row['Lowest Online'] = result.lowestOnline || '';
        row['Price Notes'] = result.note || (result.undercut ? 'Undercut' : '');

        console.log(`    💰 Final Price: ₹${result.price} (${result.source})`);

        processed++;

        // Save progress after each product
        const updatedCSV = toCSV(newHeaders, rows);
        fs.writeFileSync(filePath, updatedCSV);

        // Rate limiting between products
        await delay(3000);
    }

    console.log(`  ✅ Completed: ${processed} products processed`);
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

    console.log(`🚀 Price Comparison Tool`);
    console.log(`📊 Found ${csvFiles.length} CSV files to process`);
    console.log(`🌐 Searching: Amazon, Flipkart, ElitesHub, MDComputers, VedantComputers`);
    console.log(`\n⏱️  This will take a while due to rate limiting...\n`);

    for (const file of csvFiles) {
        await processCSVFile(file);
    }

    console.log('\n🎉 All files processed successfully!');
}

main().catch(console.error);
