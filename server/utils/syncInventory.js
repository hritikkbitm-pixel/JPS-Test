const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const Product = require('../models/Product');

const syncInventory = async () => {
    const csvPath = path.join(__dirname, '../../jps-inventory.csv');

    if (!fs.existsSync(csvPath)) {
        console.log('⚠️ No local inventory CSV found at:', csvPath);
        return;
    }

    console.log('🔄 Syncing inventory from local CSV...');
    const results = [];

    fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            try {
                let updatedCount = 0;
                let createdCount = 0;

                for (const row of results) {
                    if (!row.id) continue;

                    const updateData = { ...row };

                    // Parse JSON fields
                    if (updateData.specs) {
                        try {
                            updateData.specs = JSON.parse(updateData.specs);
                        } catch (e) {
                            delete updateData.specs;
                        }
                    }
                    if (updateData.images) {
                        try {
                            updateData.images = JSON.parse(updateData.images);
                        } catch (e) {
                            delete updateData.images;
                        }
                    }

                    // Convert types
                    if (updateData.price) updateData.price = Number(updateData.price);
                    if (updateData.stock) updateData.stock = Number(updateData.stock);
                    if (updateData.sold) updateData.sold = Number(updateData.sold);
                    if (updateData.available) updateData.available = updateData.available === 'true';

                    const result = await Product.findOneAndUpdate(
                        { id: row.id },
                        updateData,
                        { upsert: true, new: true, setDefaultsOnInsert: true }
                    );

                    if (result.isNew) createdCount++;
                    else updatedCount++;
                }

                console.log(`✅ Inventory Synced: ${updatedCount} updated, ${createdCount} created.`);
            } catch (err) {
                console.error('❌ Error syncing inventory:', err);
            }
        });
};

module.exports = syncInventory;
