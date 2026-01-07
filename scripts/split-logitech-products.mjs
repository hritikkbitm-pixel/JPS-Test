import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the Excel file
const workbook = XLSX.readFile(path.join(__dirname, '../untitled folder/Price List 8th Oct 25.xlsx'));
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

// Get row 1 as headers (actual column labels)
const headers = data[1]; // Row index 1 has the actual headers

// Define product type mapping based on Hierarchy 3 (column index 2)
const productTypeMapping = {
    // Keyboards
    'Tablet Keyboards Type': 'keyboard',
    'Cordless Keyboards Type': 'keyboard',
    'Living Room Keyboards Type': 'keyboard',
    'Gaming Keyboard Type': 'keyboard',

    // Mouse
    'Cordless Mice Type': 'mouse',
    'Gaming Mice Type': 'mouse',
    'Trackball Type': 'mouse',

    // Combos (Keyboard + Mouse)
    'Cordless Combos Type': 'combo',
    'Keyboards & Combos Other Type': 'combo',

    // Tablet Accessories
    'Tablet Other Accessories Type': 'tablet-accessories',

    // Other Pointing Devices
    'Pointing Devices Other Type': 'pointing-devices',

    // Presentation Tools
    'Presentation Tools Type': 'presenter',

    // Webcams
    'Webcams Type': 'webcam',

    // Headsets
    'Corded Headsets Type': 'headset',
    'Cordless Headsets Type': 'headset',
    'Gaming Headsets Type': 'headset',

    // Speakers
    '2.1 System Type': 'speaker',
    '5.1 System Type': 'speaker',

    // Gaming Controllers
    'Gaming Gamepads Type': 'gamepad',
    'Gaming Joysticks Type': 'joystick',
    'Gaming Steering Wheels Type': 'steering-wheel',

    // Gaming Other
    'Pc Gaming Other Type': 'gaming-accessories',
};

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

// Extract clean model name from product name
function extractModelName(productName) {
    let cleaned = productName
        .replace(/\s*-\s*(GRAPHITE|BLACK|WHITE|GREY|GRAY|BLUE|ROSE|PINK|SAND|LILAC|OFF-WHITE|PALE GREY|DARK ROSE|OXFORD GREY|VIVID RED|CHARTREUSE|TONAL|MID GREY|DARKER ROSE|LAVENDER|SILVER|N\/A)\s*/gi, ' ')
        .replace(/\s*-\s*(US|IND|APANZ|AMR|AP|LATA|TWKOR|AMR\+AP|APANZ-\d+|AMR-\d+|LATA-\d+|TWKOR-\d+|WW-\d+)\s*-?/gi, ' ')
        .replace(/\s*-\s*\d+\s*$/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    return cleaned;
}

// Generate specs based on product name and category
function generateSpecs(productName, category) {
    const modelName = extractModelName(productName);
    const features = categoryFeatures[category] || categoryFeatures['mouse'];

    // Remove newlines and ensure single line
    const shortDesc = `${modelName} - Premium Logitech ${category} designed for comfort and performance.`.substring(0, 150).replace(/[\r\n]+/g, ' ');

    const longDesc = `The ${modelName} is a high-quality ${category} from Logitech, built with precision engineering and user comfort in mind. Whether you're working from home, in the office, or gaming, this ${category} delivers exceptional performance and reliability. Features include advanced connectivity options, durable construction, and the trusted quality that Logitech is known for. Perfect for professionals and enthusiasts alike who demand the best from their peripherals.`.replace(/[\r\n]+/g, ' ');

    return {
        keyFeatures: features,
        shortDescription: shortDesc,
        longDescription: longDesc
    };
}

// Create output directory
const outputDir = path.join(__dirname, '../logitech');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Group products by type
const productsByType = {};

// Skip first 2 rows (headers row 0 and 1)
data.slice(2).forEach(row => {
    if (!row || row.length === 0) return;

    const hierarchy3 = row[2]; // Hierarchy 3 column
    const productType = productTypeMapping[hierarchy3] || 'other';

    if (!productsByType[productType]) {
        productsByType[productType] = [];
    }

    productsByType[productType].push(row);
});

// Define the columns we want to keep (the main product info columns)
const columnsToKeep = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
const headerRow = [
    'Category Head',
    'Hierarchy 2',
    'Hierarchy 3',
    'Strategic Pillar',
    'Part Code',
    'Product Name',
    'MSP Rashi',
    'MSP Supertron',
    'MRP Rashi',
    'MRP Supertron',
    'Rashi Available',
    'Supertron Available',
    'GTM Matrix',
    'Warranty',
    'Remarks',
    'Key Features',
    'Short Description',
    'Long Description'
];

// Escape CSV cell - handle quotes, commas, and newlines
function escapeCSV(value) {
    if (value === undefined || value === null) return '';
    let str = String(value);
    // Remove any newlines to prevent CSV corruption
    str = str.replace(/[\r\n]+/g, ' ').trim();
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

// Write each product type to a separate CSV file
Object.entries(productsByType).forEach(([type, products]) => {
    const csvLines = [headerRow.map(escapeCSV).join(',')];

    products.forEach(row => {
        const productName = row[5] || '';
        const specs = generateSpecs(productName, type);

        const filteredRow = columnsToKeep.map(i => {
            const val = row[i];
            return val !== undefined && val !== null ? val : '';
        });

        // Add the generated specs
        filteredRow.push(specs.keyFeatures);
        filteredRow.push(specs.shortDescription);
        filteredRow.push(specs.longDescription);

        csvLines.push(filteredRow.map(escapeCSV).join(','));
    });

    const filename = `logitech-${type}.csv`;
    fs.writeFileSync(path.join(outputDir, filename), csvLines.join('\n'));
    console.log(`Created ${filename} with ${products.length} products`);
});

console.log('\n✅ All files saved to:', outputDir);
