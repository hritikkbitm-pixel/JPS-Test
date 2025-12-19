const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

console.log('--- Environment Check ---');
console.log('MONGODB_URI present:', !!process.env.MONGODB_URI);
if (process.env.MONGODB_URI) {
    console.log('MONGODB_URI starts with:', process.env.MONGODB_URI.substring(0, 15) + '...');
}
console.log('-------------------------');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database Connection
const syncInventory = require('./utils/syncInventory');

let lastDbError = null;

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jps-store')
    .then(() => {
        console.log('MongoDB connected');
        lastDbError = null;
        // Sync inventory on startup
        syncInventory();
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        lastDbError = err.message;
    });

app.get('/api/db-test', async (req, res) => {
    try {
        const state = mongoose.connection.readyState;
        const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
        res.json({
            status: states[state] || 'unknown',
            dbName: mongoose.connection.name,
            host: mongoose.connection.host,
            lastError: lastDbError
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Routes
app.use('/api/products', require('./routes/products'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/banners', require('./routes/banners'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/audit', require('./routes/audit'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/user', require('./routes/user'));

app.get('/api', (req, res) => {
    res.json({ message: 'JPS API is operational', version: '1.0' });
});

app.get('/', (req, res) => {
    res.send('JPS Store API is running');
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('🔥 SERVER ERROR:', err.stack);
    res.status(500).json({
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'production' ? 'Something went wrong on our end.' : err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
