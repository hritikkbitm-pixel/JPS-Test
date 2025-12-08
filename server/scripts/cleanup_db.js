const mongoose = require('mongoose');
const Product = require('../models/Product');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const cleanupProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jps-store');
        console.log('Connected to MongoDB');

        // Delete ALL products to ensure fresh sync
        const result = await Product.deleteMany({});
        console.log(`Deleted ${result.deletedCount} products (Full Wipe).`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

cleanupProducts();
