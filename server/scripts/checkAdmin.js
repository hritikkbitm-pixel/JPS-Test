const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const checkAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const email = 'admin@jps.com';
        const user = await User.findOne({ email });

        if (user) {
            console.log('User found:', user.email);
            console.log('Role:', user.role);
            console.log('Password hash:', user.password);

            // Test password
            const isMatch = await user.matchPassword('admin123');
            console.log('Password "admin123" matches:', isMatch);
        } else {
            console.log('User NOT found:', email);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

checkAdmin();
