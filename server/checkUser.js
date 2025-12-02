const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');
const path = require('path');

// Load env from current directory
dotenv.config({ path: path.join(__dirname, '.env') });

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/jps-store';
console.log('Connecting to:', uri);

mongoose.connect(uri)
    .then(async () => {
        const user = await User.findOne({ email: 'armaan@gmail.com' });
        console.log('User:', user);
        if (user) {
            console.log('Password Hash:', user.password);
        } else {
            console.log('User not found');
        }
        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
