const mongoose = require('mongoose');
const Category = require('../models/Category');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const fixCategory = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jps-store');
        console.log('Connected to MongoDB');

        // Find category with id 'cabinets'
        const cabinetCat = await Category.findOne({ id: 'cabinets' });

        if (cabinetCat) {
            console.log('Found category "cabinets". Updating ID to "case"...');
            cabinetCat.id = 'case';
            cabinetCat.label = 'Cabinets'; // Ensure label is correct
            await cabinetCat.save();
            console.log('✅ Updated category ID to "case".');
        } else {
            console.log('Category with ID "cabinets" not found.');

            // Check if 'case' already exists
            const caseCat = await Category.findOne({ id: 'case' });
            if (caseCat) {
                console.log('Category "case" already exists.');
            } else {
                console.log('Creating "case" category since neither exists...');
                await Category.create({
                    id: 'case',
                    label: 'Cabinets',
                    image: 'https://img.freepik.com/free-photo/modern-computer-case-with-rgb-lighting_23-2150834145.jpg'
                });
                console.log('✅ Created "case" category.');
            }
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
};

fixCategory();
