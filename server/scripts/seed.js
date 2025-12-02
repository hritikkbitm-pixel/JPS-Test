const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Banner = require('../models/Banner');

dotenv.config({ path: path.join(__dirname, '../.env') });

const DB_FILE = path.join(__dirname, '../../db.json');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jps-store')
    .then(() => {
        console.log('MongoDB connected for seeding');
        seedData();
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

const seedData = async () => {
    try {
        const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));

        // Clear existing data
        await Product.deleteMany({});
        await Order.deleteMany({});
        await User.deleteMany({});
        await Banner.deleteMany({});

        // Insert Products
        if (data.products) {
            await Product.insertMany(data.products);
            console.log('Products seeded');
        }

        // Insert Orders
        if (data.orders) {
            await Order.insertMany(data.orders);
            console.log('Orders seeded');
        }

        // Insert Users
        if (data.users) {
            await User.insertMany(data.users);
            console.log('Users seeded');
        }

        // Insert Banners
        if (data.banners) {
            await Banner.insertMany(data.banners);
            console.log('Banners seeded');
        }

        console.log('Seeding complete');
        process.exit();
    } catch (err) {
        console.error('Error seeding data:', err);
        process.exit(1);
    }
};

