/**
 * HP Laptop Direct Import Script
 * 
 * Directly imports HP laptops from the CSV file to MongoDB
 * Run from server directory: node scripts/import-hp-laptops.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const CSV_FILE = path.join(__dirname, '../../untitled folder/HP Laptop_priced.csv');

// Product Schema (inline for simplicity)
const ProductSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    mrp: { type: Number },
    stock: { type: Number, required: true },
    category: { type: String, required: true },
    brand: { type: String, required: true },
    image: { type: String },
    images: [{ type: String }],
    specs: { type: Map, of: mongoose.Schema.Types.Mixed },
    description: { type: String },
    sold: { type: Number, default: 0 },
    available: { type: Boolean, default: true }
}, { timestamps: true });

const Product = mongoose.model('Product', ProductSchema);

// Transform HP CSV row to Product schema
function transformHpRow(row) {
    const get = (key) => row[key] || '';

    const model = get('Model');
    const partNo = get('Part no.');
    const subBrand = get('Sub Brand');

    // Parse prices
    const finalPriceStr = get('Final Price')?.toString().replace(/[^0-9.]/g, '') || '0';
    const mrpStr = get('MRP')?.toString().replace(/[^0-9.]/g, '') || '0';
    const finalPrice = Number(finalPriceStr) || 0;
    const mrp = Number(mrpStr) || 0;

    // Generate ID from part number
    const id = partNo ? `hp_${partNo.toLowerCase().replace(/[^a-z0-9]/g, '_')}` : `hp_${model.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    // Features for description
    const features = get('Features');

    return {
        id: id,
        name: model.startsWith('HP') ? model : `HP ${model}`.trim(),
        brand: 'HP',
        category: 'laptop',
        price: finalPrice,
        mrp: mrp > 0 ? mrp : undefined,
        image: get('Image') || '',
        stock: 10,
        available: true,
        sold: 0,
        description: features || '',
        specs: {
            sub_brand: subBrand,
            part_no: partNo,
            processor: get('Processor'),
            ram: get('RAM'),
            storage: get('Storage'),
            graphics: get('Graphics'),
            os: get('OS/MSO'),
            features: features,
            display: get('Display'),
            color: get('Colour'),
            warranty: get('Service'),
            segment: get('Category'),
        }
    };
}

async function main() {
    console.log('='.repeat(70));
    console.log('HP Laptop Direct Import to MongoDB');
    console.log('='.repeat(70));
    console.log(`\nCSV File: ${CSV_FILE}`);
    console.log('\n');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        console.error('❌ MONGODB_URI not found in environment');
        process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    try {
        // Read and parse CSV
        const records = [];
        await new Promise((resolve, reject) => {
            fs.createReadStream(CSV_FILE)
                .pipe(csv())
                .on('data', (data) => records.push(data))
                .on('end', resolve)
                .on('error', reject);
        });

        console.log(`Found ${records.length} records in CSV\n`);

        // Clear existing HP laptops
        const deleteResult = await Product.deleteMany({
            brand: 'HP',
            category: 'laptop'
        });
        console.log(`🗑️ Cleared ${deleteResult.deletedCount} existing HP laptops\n`);

        // Transform and insert
        let inserted = 0;
        let skipped = 0;

        for (const row of records) {
            const model = row['Model'];
            if (!model || !model.trim()) {
                skipped++;
                continue;
            }

            const product = transformHpRow(row);

            // Skip products without valid price
            if (!product.price || product.price === 0) {
                console.log(`⚠️ Skipping ${product.name} - no price`);
                skipped++;
                continue;
            }

            try {
                await Product.findOneAndUpdate(
                    { id: product.id },
                    product,
                    { upsert: true, new: true }
                );
                inserted++;
                console.log(`✅ ${product.name} - ₹${product.price} (MRP: ₹${product.mrp || 'N/A'})`);
            } catch (err) {
                console.error(`❌ Error inserting ${product.name}: ${err.message}`);
            }
        }

        console.log('\n' + '='.repeat(70));
        console.log('IMPORT SUMMARY');
        console.log('='.repeat(70));
        console.log(`✅ Inserted/Updated: ${inserted}`);
        console.log(`⏭️ Skipped: ${skipped}`);

    } catch (error) {
        console.error(`❌ Import failed: ${error.message}`);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

main();
