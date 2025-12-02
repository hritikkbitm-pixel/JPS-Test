const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
require('dotenv').config();
const { OAuth2Client } = require('google-auth-library');

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'db.json');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Increased limit for base64 images
app.use(express.static(__dirname));

// API to get Google Client ID (Public)
app.get('/api/config', (req, res) => {
    res.json({ clientId: process.env.GOOGLE_CLIENT_ID });
});

// API to verify Google Token
app.post('/api/auth/google', async (req, res) => {
    const { token } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        res.json({
            success: true,
            user: {
                name: payload.name,
                email: payload.email,
                picture: payload.picture,
                provider: 'google'
            }
        });
    } catch (error) {
        console.error('Error verifying Google token:', error);
        res.status(401).json({ success: false, error: 'Invalid token' });
    }
});

// Helper to read DB
const readDB = () => {
    if (!fs.existsSync(DB_FILE)) return { products: [], banners: [], orders: [], users: [] };
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
};

// Helper to write DB
const writeDB = (data) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// GET all data
app.get('/api/data', (req, res) => {
    try {
        const data = readDB();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to read database' });
    }
});

// POST update all data (Sync state)
app.post('/api/data', (req, res) => {
    try {
        const newData = req.body;
        // Basic validation
        if (!newData.products || !newData.banners) {
            return res.status(400).json({ error: 'Invalid data structure' });
        }
        writeDB(newData);
        res.json({ success: true, message: 'Data saved successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save database' });
    }
});

// Fallback for SPA routing (if needed, but we are using hash routing or simple JS routing)
app.get('*', (req, res) => {
    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, 'index.html'));
    } else {
        res.status(404).send('Not found');
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
