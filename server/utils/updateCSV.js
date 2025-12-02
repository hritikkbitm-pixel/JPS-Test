const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');
const Product = require('../models/Product');

const updateCSV = async () => {
    try {
        const products = await Product.find().lean();

        if (products.length === 0) {
            console.log('No products to sync to CSV.');
            return;
        }

        const flattenedProducts = products.map(p => ({
            ...p,
            specs: p.specs ? JSON.stringify(p.specs) : '',
            images: p.images ? JSON.stringify(p.images) : ''
        }));

        const fields = ['id', 'name', 'price', 'stock', 'category', 'brand', 'image', 'images', 'specs', 'sold', 'available'];
        const json2csvParser = new Parser({ fields });
        const csvData = json2csvParser.parse(flattenedProducts);

        const csvPath = path.join(__dirname, '../../jps-inventory.csv');
        fs.writeFileSync(csvPath, csvData);
        console.log('✅ jps-inventory.csv updated successfully.');
    } catch (err) {
        console.error('❌ Error updating CSV:', err);
    }
};

module.exports = updateCSV;
