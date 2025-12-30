const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const Product = require('../models/Product');

const syncInventory = async () => {
    const productsDir = path.join(__dirname, '../data/products');

    if (!fs.existsSync(productsDir)) {
        console.log('⚠️ No products data directory found at:', productsDir);
        return;
    }

    console.log('🔄 Syncing inventory from category CSVs...');

    const files = fs.readdirSync(productsDir).filter(file => file.endsWith('.csv'));
    let totalUpdated = 0;

    for (const file of files) {
        const filePath = path.join(productsDir, file);
        const category = file.replace('.csv', '');

        let dbCategory = category;
        if (category === 'cpus') dbCategory = 'cpu';
        if (category === 'motherboards') dbCategory = 'motherboard';
        if (category === 'gpus') dbCategory = 'gpu';
        if (category === 'cabinets') dbCategory = 'case';
        if (category === 'coolers') dbCategory = 'cooling';

        const results = [];

        await new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', resolve)
                .on('error', reject);
        });

        const syncedIds = [];
        const bulkOps = [];

        for (const row of results) {
            const id = row.id || row['"id"'];
            if (!id) {
                console.warn(`⚠️ Missing ID in row for ${file}:`, row);
                continue;
            }

            syncedIds.push(id);

            const updateData = {
                id: id,
                category: dbCategory,
                brand: row.brand || row['"brand"'] || '',
                sold: Number(row.sold || row['"sold"']) || 0,
                available: (row.stock_status || row['"stock_status"']) === 'In Stock',
                stock: (row.stock_status || row['"stock_status"']) === 'In Stock' && !Number(row.stock || row['"stock"']) ? 10 : Number(row.stock || row['"stock"'] || 0),
                price: Number((row.price || row['"price"'])?.toString().replace(/[^0-9.]/g, '') || 0),
                mrp: Number((row.mrp || row['"mrp"'])?.toString().replace(/[^0-9.]/g, '') || 0) || undefined,
                name: row.name || row['"name"'] || row.full_name || row['"full_name"'] || id,
                image: row.image || row['"image"'] || row.image_url || row['"image_url"'] || '',
                // images: [], // Removed to avoid overwriting existing images array if present
                // specs: {}   // Handle specs separately if needed, but for bulkWrite update usually $set is safer
            };

            // Populate specs
            const coreFields = ['id', 'name', 'full_name', 'price', 'mrp', 'stock', 'stock_status', 'category', 'brand', 'image', 'image_url', 'images', 'sold', 'available', '"id"', '"name"', '"full_name"', '"price"', '"mrp"', '"stock"', '"stock_status"', '"category"', '"brand"', '"image"', '"image_url"', '"images"', '"sold"', '"available"'];
            const specs = {};
            Object.keys(row).forEach(key => {
                if (!coreFields.includes(key)) {
                    specs[key] = row[key];
                }
            });
            updateData.specs = specs;

            bulkOps.push({
                updateOne: {
                    filter: { id: id },
                    update: { $set: updateData },
                    upsert: true
                }
            });
        }

        if (bulkOps.length > 0) {
            await Product.bulkWrite(bulkOps);
            totalUpdated += bulkOps.length;
        }

        // NOTE: We intentionally do NOT delete products that are missing from CSV.
        // MongoDB is the source of truth. CSVs are only for bulk import.
        // This prevents data loss on Render where uploaded files are ephemeral.
        console.log(`✅ Synced ${file}: ${syncedIds.length} items upserted to database.`);
    }

    console.log(`🎉 Inventory Sync Complete. Processed ${totalUpdated} items.`);
};

module.exports = syncInventory;
