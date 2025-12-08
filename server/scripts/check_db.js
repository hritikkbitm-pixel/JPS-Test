const mongoose = require('mongoose');
const Product = require('../models/Product');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const checkProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jps-store');
        console.log('Connected to MongoDB');

        const total = await Product.countDocuments();
        console.log(`Total products: ${total}`);

        const oldIdCount = await Product.countDocuments({ id: { $regex: /^\d+$/ } });
        console.log(`Products with numeric IDs (old): ${oldIdCount}`);

        const newIdCount = await Product.countDocuments({ id: { $regex: /^[a-z]+-/ } });
        console.log(`Products with slug IDs (new): ${newIdCount}`);

        const msiPromoCount = await Product.countDocuments({ name: { $regex: /Anno 117/ } });
        console.log(`Products with 'Anno 117' in name: ${msiPromoCount}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkProducts();
