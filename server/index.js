const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images

// Database Connection
const syncInventory = require('./utils/syncInventory');

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jps-store')
    .then(() => {
        console.log('MongoDB connected');
        // Sync inventory on startup
        syncInventory();
    })
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/products', require('./routes/products'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/banners', require('./routes/banners'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/audit', require('./routes/audit'));

app.get('/', (req, res) => {
    res.send('JPS Store API is running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
