const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/jps-store';

console.log('--- Environment Check ---');
console.log('MONGODB_URI present:', !!process.env.MONGODB_URI);
console.log('MONGO_URL present:', !!process.env.MONGO_URL);
if (MONGO_URI.startsWith('mongodb+srv')) {
    console.log('Using Atlas Connection String');
}
console.log('-------------------------');

// Middleware
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

app.use(compression());
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for now (may conflict with inline scripts)
    crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate Limiting - Protect against DDoS
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 requests per IP per 15 min
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply stricter limit to auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20, // Only 20 auth attempts per 15 min
    message: { error: 'Too many login attempts, please try again later.' }
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

console.log('🛡️ Security: Helmet & Rate Limiting enabled');

// Database Connection
const syncInventory = require('./utils/syncInventory');

let lastDbError = null;

// Database Connection
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('MongoDB connected');
        lastDbError = null;
        // Sync inventory on startup
        // syncInventory(); // Disabled to use MongoDB as source of truth
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
app.use('/api/seasons', require('./routes/seasons'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/offer-tiles', require('./routes/offer-tiles'));
app.use('/api/siteinfo', require('./routes/siteinfo'));
app.use('/api/news', require('./routes/news'));

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
