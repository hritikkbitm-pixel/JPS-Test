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
    let totalCreated = 0;

    for (const file of files) {
        const filePath = path.join(productsDir, file);
        const category = file.replace('.csv', ''); // e.g. 'cpus' -> 'cpus'

        let dbCategory = category;
        if (category === 'cpus') dbCategory = 'cpu';
        if (category === 'motherboards') dbCategory = 'motherboard';
        if (category === 'gpus') dbCategory = 'gpu';
        if (category === 'cabinets') dbCategory = 'case';
        if (category === 'coolers') dbCategory = 'cooler';

        const results = [];

        await new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', resolve)
                .on('error', reject);
        });

        const syncedIds = [];

        for (const row of results) {
            if (!row.id) continue;

            syncedIds.push(row.id);

            const updateData = {
                id: row.id,
                category: dbCategory,
                brand: row.brand,
                sold: Number(row.sold) || 0,
                available: row.stock_status === 'In Stock',
                stock: Number(row.stock || 0),
                price: Number(row.price?.toString().replace(/[^0-9.]/g, '') || 0),
                name: row.name || row.full_name || row.id,
                image: row.image || row.image_url || '',
                images: [],
                specs: {}
            };

            // Populate specs with EVERYTHING else
            const coreFields = ['id', 'name', 'full_name', 'price', 'stock', 'stock_status', 'category', 'brand', 'image', 'image_url', 'images', 'sold', 'available'];

            Object.keys(row).forEach(key => {
                if (!coreFields.includes(key)) {
                    updateData.specs[key] = row[key];
                }
            });

            await Product.findOneAndUpdate(
                { id: row.id },
                updateData,
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
        }

        // Cleanup: Remove products in this category that are NOT in the CSV (Synced IDs)
        if (syncedIds.length > 0) {
            const deleteResult = await Product.deleteMany({
                category: dbCategory,
                id: { $nin: syncedIds }
            });
            if (deleteResult.deletedCount > 0) {
                console.log(`  - Cleaned up ${deleteResult.deletedCount} old items from ${dbCategory}.`);
            }
        }

        console.log(`- Synced ${file}: ${results.length} items.`);
    }

    console.log(`✅ Inventory Sync Complete.`);
};

module.exports = syncInventory;
