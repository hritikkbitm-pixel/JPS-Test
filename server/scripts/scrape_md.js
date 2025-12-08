const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const { Parser } = require('json2csv');
const path = require('path');

const BASE_URL = 'https://mdcomputers.in';
const CATEGORIES = [
    { name: 'Processor', url: 'https://mdcomputers.in/catalog/processor' },
    { name: 'Graphics Card', url: 'https://mdcomputers.in/catalog/graphics-card' },
    { name: 'Motherboard', url: 'https://mdcomputers.in/catalog/motherboard' },
    { name: 'Memory', url: 'https://mdcomputers.in/catalog/ram' },
    { name: 'Storage', url: 'https://mdcomputers.in/catalog/storage' },
    { name: 'SMPS', url: 'https://mdcomputers.in/catalog/smps' },
    { name: 'Cabinet', url: 'https://mdcomputers.in/catalog/cabinet' },
    { name: 'Cooling System', url: 'https://mdcomputers.in/catalog/cooling-system' },
    { name: 'CPU Cooler', url: 'https://mdcomputers.in/catalog/cpu-cooler' },
    { name: 'Custom Cooling', url: 'https://mdcomputers.in/catalog/custom-liquid-cooling' },
    { name: 'Monitor', url: 'https://mdcomputers.in/catalog/monitor' },
    { name: 'Peripherals', url: 'https://mdcomputers.in/catalog/peripherals' },
    { name: 'Laptop', url: 'https://mdcomputers.in/catalog/laptop' },
    { name: 'Mini PC', url: 'https://mdcomputers.in/catalog/mini-pc' }
];

const OUTPUT_FILE = path.join(__dirname, 'md_products.csv');

// Schema fields based on the user's request
const FIELDS = [
    'id', 'name', 'category', 'brand', 'price', 'stock', 'sold', 'available',
    'image_1', 'image_2', 'image_3', 'image_4', 'image_5', 'image_6',
    'socket', 'form_factor', 'tdp_watts', 'memory_type', 'clock_speed',
    'chipset', 'vram_gb', 'length_mm', 'height_mm', 'slots', 'interface',
    'capacity_gb', 'modules_count'
];

// Mapping from site spec keys to CSV columns
const SPEC_MAPPING = {
    'socket': 'socket',
    'cpu socket': 'socket',
    'form factor': 'form_factor',
    'tdp': 'tdp_watts',
    'memory type': 'memory_type',
    'speed': 'clock_speed',
    'core clock': 'clock_speed',
    'chipset': 'chipset',
    'memory size': 'vram_gb', // for GPU
    'vram': 'vram_gb',
    'length': 'length_mm',
    'height': 'height_mm',
    'interface': 'interface',
    'capacity': 'capacity_gb',
    'modules': 'modules_count'
};

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeProduct(url, categoryName) {
    try {
        console.log(`Scraping product: ${url}`);
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const $ = cheerio.load(data);

        let name = $('h1').text().trim();
        // Remove potential duplicates if h1 contains hidden text
        if (name.length > 10 && name.substring(0, name.length / 2) === name.substring(name.length / 2)) {
            name = name.substring(0, name.length / 2);
        }

        // Price: Regex search for "Offer Price" or "Special Price" first
        let price = '';
        const html = $.html();

        // Try to find price near "Offer Price" or "Special Price"
        const offerPriceMatch = html.match(/(?:Offer|Special|Deal)\s*Price\s*:?\s*₹\s?([\d,]+)/i);
        if (offerPriceMatch) {
            price = offerPriceMatch[1];
        } else {
            // Fallback to first significant price
            const priceMatch = html.match(/₹\s?([\d,]+)/);
            if (priceMatch) price = priceMatch[1];
        }
        price = price.replace(/[^\d.]/g, '');

        const stockText = $('.stock').text().trim();
        const stock = stockText.includes('In Stock') ? 'In Stock' : 'Out of Stock';
        const available = stock === 'In Stock';

        let brand = '';
        // Try to find brand in specs first
        $('#tab-specification table tr').each((i, el) => {
            const key = $(el).find('td').eq(0).text().trim().toLowerCase();
            const value = $(el).find('td').eq(1).text().trim();
            if (key.includes('brand')) brand = value;
        });

        // Images disabled per user request
        const imageFields = {
            image_1: '', image_2: '', image_3: '', image_4: '', image_5: '', image_6: ''
        };

        const specs = {};
        $('#tab-specification table tr').each((i, el) => {
            const key = $(el).find('td').eq(0).text().trim().toLowerCase().replace(':', '');
            const value = $(el).find('td').eq(1).text().trim();

            // Check if key maps to one of our fields
            // We do a fuzzy match or direct lookup
            for (const [mapK, mapV] of Object.entries(SPEC_MAPPING)) {
                if (key.includes(mapK)) {
                    specs[mapV] = value;
                }
            }

            if (key === 'brand') brand = value;
        });

        // Extract ID from URL or input
        const id = $('input[name="product_id"]').val() || '';

        return {
            id,
            name,
            category: categoryName,
            brand: brand || name.split(' ')[0], // Fallback to first word of name
            price,
            stock,
            sold: 0, // Not visible
            available,
            ...imageFields,
            ...specs
        };

    } catch (e) {
        console.error(`Failed to scrape product ${url}: ${e.message}`);
        return null;
    }
}

async function scrapeCategory(category) {
    console.log(`Scraping category: ${category.name}`);
    const products = [];
    let page = 1;
    let hasNextPage = true;

    while (hasNextPage) {
        const catUrl = `${category.url}?page=${page}`;
        console.log(`Visiting ${catUrl}`);
        try {
            const response = await axios.get(catUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            // Check for redirect (infinite loop prevention)
            if (page > 1) {
                const finalUrl = response.request.res.responseUrl;
                if (finalUrl && !finalUrl.includes(`page=${page}`)) {
                    console.log(`Redirect detected to ${finalUrl}. Reached end of category.`);
                    hasNextPage = false;
                    break;
                }
            }

            const $ = cheerio.load(response.data);

            const productLinks = [];
            $('.product-image-link').each((i, el) => {
                productLinks.push($(el).attr('href'));
            });

            if (productLinks.length === 0) {
                hasNextPage = false;
                break;
            }

            // Process products in batches to speed up scraping
            const BATCH_SIZE = 5;
            for (let i = 0; i < productLinks.length; i += BATCH_SIZE) {
                if (products.length >= 5000) break;

                const chunk = productLinks.slice(i, i + BATCH_SIZE);
                const promises = chunk.map(link => scrapeProduct(link, category.name));
                const results = await Promise.all(promises);

                for (const productData of results) {
                    if (productData) {
                        products.push(productData);
                    }
                }
                // Small delay between batches to be polite but faster
                await sleep(1000);
            }

            // Check for next page
            const nextLink = $('ul.pagination li.active').next().find('a').attr('href');
            if (!nextLink) {
                hasNextPage = false;
            } else {
                page++;
            }
        } catch (e) {
            console.error(`Failed to scrape category page ${catUrl}: ${e.message}`);
            break;
        }
    }
    return products;
}

async function main() {
    const allProducts = [];

    for (const cat of CATEGORIES) {
        const products = await scrapeCategory(cat);
        allProducts.push(...products);
    }

    const parser = new Parser({ fields: FIELDS });
    const csv = parser.parse(allProducts);

    fs.writeFileSync(OUTPUT_FILE, csv);
    console.log(`Successfully wrote ${allProducts.length} products to ${OUTPUT_FILE}`);
}

main();

