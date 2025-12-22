const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { Parser } = require('json2csv');
const csv = require('csv-parser');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { logAdminAction } = require('../utils/logger');
const syncInventory = require('../utils/syncInventory');

const upload = multer({ dest: 'uploads/' });

const PRODUCTS_DIR = path.join(__dirname, '../data/products');

// Helper: Get CSV path from category
const getCsvPath = (category) => {
    let filename = '';
    const cat = category.toLowerCase();
    if (cat === 'cpu') filename = 'cpus.csv';
    else if (cat === 'motherboard') filename = 'motherboards.csv';
    else if (cat === 'gpu') filename = 'gpus.csv';
    else if (cat === 'ram') filename = 'ram.csv';
    else if (cat === 'storage') filename = 'storage.csv';
    else if (cat === 'psu') filename = 'psu.csv';
    else if (cat === 'case') filename = 'cabinets.csv';
    else if (cat === 'cooling' || cat === 'cooler') filename = 'coolers.csv';
    else return null;

    return path.join(PRODUCTS_DIR, filename);
};

// Middleware for Admin Auth
const checkAuth = (req, res, next) => {
    const userEmail = req.headers['x-user-email'];
    const admins = ['hritik@jps.com', 'admin@jps.com'];
    if (!userEmail || !admins.includes(userEmail)) {
        console.warn(`Unauthorized access attempt from: ${userEmail}`);
        return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    }
    next();
};

// --- PUBLIC ROUTES (Storefront & Builder) ---

// Get all products (from Mongo)
router.get('/', async (req, res) => {
    try {
        const { category } = req.query;
        const query = category && category !== 'all' ? { category: category.toLowerCase() } : {};
        const products = await Product.find(query);
        res.json(products);
    } catch (err) {
        console.error('Get Products Error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Add Product to Mongo (and attempt CSV sync)
router.post('/', checkAuth, async (req, res) => {
    try {
        const productData = req.body;
        if (!productData.id) productData.id = Math.random().toString(36).substr(2, 9);

        // Save to Mongo
        const product = new Product(productData);
        await product.save();

        // Optional: Also add to CSV if category matches
        const csvPath = getCsvPath(productData.category);
        if (csvPath && fs.existsSync(csvPath)) {
            const rows = [];
            await new Promise((resolve) => {
                fs.createReadStream(csvPath)
                    .pipe(csv())
                    .on('data', row => rows.push(row))
                    .on('end', resolve)
                    .on('error', () => resolve()); // Ignore read errors for append
            });
            rows.push(productData);
            const json2csvParser = new Parser({ fields: Object.keys(rows[0] || productData) });
            const csvData = json2csvParser.parse(rows);
            fs.writeFileSync(csvPath, csvData);
        }

        res.status(201).json(product);
    } catch (err) {
        console.error('Create Product Error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Batch Upload JSON Products
router.post('/batch', checkAuth, async (req, res) => {
    try {
        const { products } = req.body;
        if (!Array.isArray(products)) return res.status(400).json({ message: 'Invalid products data' });

        console.log(`📦 Processing batch upload of ${products.length} items...`);

        // Upsert to Mongo
        for (const prod of products) {
            // Ensure category is lowercase and consistent
            if (prod.category) prod.category = prod.category.toLowerCase();
            if (prod.category === 'cooler') prod.category = 'cooling';

            await Product.findOneAndUpdate(
                { id: prod.id },
                prod,
                { upsert: true, new: true }
            );
        }

        // NOTE: We do NOT trigger syncInventory here because it would
        // read the OLD files from disk and overwrite our fresh updates.
        // User should update the CSVs manually on disk for persistence on Render.

        res.json({ message: `Successfully processed ${products.length} products to database.` });
    } catch (err) {
        console.error('Batch Upload Error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Get one product (from Mongo)
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findOne({ id: req.params.id });
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- ADMIN ROUTES (Direct CSV Manipulation) ---

// Get products from specific Category CSV
router.get('/cat/:category', checkAuth, async (req, res) => {
    const csvPath = getCsvPath(req.params.category);
    if (!csvPath || !fs.existsSync(csvPath)) {
        return res.status(404).json({ message: 'Category CSV not found' });
    }

    const results = [];
    fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
            res.json(results);
        })
        .on('error', (err) => {
            res.status(500).json({ message: 'Error reading CSV', error: err.message });
        });
});

// Add Row to Category CSV
router.post('/cat/:category', checkAuth, async (req, res) => {
    const csvPath = getCsvPath(req.params.category);
    if (!csvPath) return res.status(400).json({ message: 'Invalid category' });

    try {
        // Read existing
        const rows = [];
        if (fs.existsSync(csvPath)) {
            await new Promise((resolve, reject) => {
                fs.createReadStream(csvPath)
                    .pipe(csv())
                    .on('data', row => rows.push(row))
                    .on('end', resolve)
                    .on('error', reject);
            });
        }

        // Append new row
        const newRow = req.body;
        // Ensure ID
        if (!newRow.id) newRow.id = Math.random().toString(36).substr(2, 9);

        rows.push(newRow);

        // Write content
        if (rows.length > 0) {
            const json2csvParser = new Parser({ fields: Object.keys(rows[0]) });
            const csvData = json2csvParser.parse(rows);
            fs.writeFileSync(csvPath, csvData);
        }

        // Sync to Mongo
        await syncInventory(); // This syncs ALL, which is safe but maybe slow? It's fine for now.

        // Audit
        const userEmail = req.headers['x-user-email'];
        await logAdminAction(userEmail, 'CREATE_PRODUCT_CSV', { category: req.params.category, id: newRow.id });

        res.status(201).json(newRow);

    } catch (err) {
        console.error('Add CSV Error:', err);
        res.status(500).json({ message: err.message });
    }
});

// --- CSV FILE OPERATIONS ---

// Download Category CSV
router.get('/cat/:category/csv', checkAuth, async (req, res) => {
    const csvPath = getCsvPath(req.params.category);
    if (!csvPath || !fs.existsSync(csvPath)) {
        return res.status(404).json({ message: 'Category CSV not found' });
    }
    const filename = `${req.params.category}_inventory.csv`;
    res.download(csvPath, filename);
});

// Upload Category CSV
router.post('/cat/:category/csv', checkAuth, upload.single('file'), async (req, res) => {
    const csvPath = getCsvPath(req.params.category);
    if (!csvPath) return res.status(400).json({ message: 'Invalid category' });

    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        // Overwrite existing CSV with uploaded file
        fs.renameSync(req.file.path, csvPath);

        // Trigger Sync
        await syncInventory();

        // Audit
        const userEmail = req.headers['x-user-email'];
        await logAdminAction(userEmail, 'UPLOAD_CSV', { category: req.params.category });

        res.json({ message: 'CSV uploaded and inventory synced successfully.' });
    } catch (err) {
        console.error('Upload CSV Error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Update Row in Category CSV
router.put('/cat/:category/:id', checkAuth, async (req, res) => {
    const csvPath = getCsvPath(req.params.category);
    if (!csvPath || !fs.existsSync(csvPath)) {
        return res.status(404).json({ message: 'Category CSV not found' });
    }

    try {
        const rows = [];
        await new Promise((resolve, reject) => {
            fs.createReadStream(csvPath)
                .pipe(csv())
                .on('data', row => rows.push(row))
                .on('end', resolve)
                .on('error', reject);
        });

        const index = rows.findIndex(r => r.id === req.params.id);
        if (index === -1) return res.status(404).json({ message: 'Product not found in CSV' });

        // Update row
        rows[index] = { ...rows[index], ...req.body };

        // Write
        const json2csvParser = new Parser({ fields: Object.keys(rows[0]) });
        const csvData = json2csvParser.parse(rows);
        fs.writeFileSync(csvPath, csvData);

        // Sync
        await syncInventory();

        // Audit
        const userEmail = req.headers['x-user-email'];
        await logAdminAction(userEmail, 'UPDATE_PRODUCT_CSV', { category: req.params.category, id: req.params.id });

        res.json(rows[index]);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete Row from Category CSV
router.delete('/cat/:category/:id', checkAuth, async (req, res) => {
    const csvPath = getCsvPath(req.params.category);
    if (!csvPath || !fs.existsSync(csvPath)) {
        return res.status(404).json({ message: 'Category CSV not found' });
    }

    try {
        const rows = [];
        await new Promise((resolve, reject) => {
            fs.createReadStream(csvPath)
                .pipe(csv())
                .on('data', row => rows.push(row))
                .on('end', resolve)
                .on('error', reject);
        });

        const newRows = rows.filter(r => r.id !== req.params.id);

        // Write
        if (newRows.length > 0) {
            const json2csvParser = new Parser({ fields: Object.keys(newRows[0]) });
            const csvData = json2csvParser.parse(newRows);
            fs.writeFileSync(csvPath, csvData);
        } else {
            // Empty file with headers? Or just empty? 
            // json2csv returns header only if data empty but fields provided.
            // But getting fields from previous rows might be unsafe if all rows deleted.
            // Assumption: At least one row usually exists. If not, file might be empty.
            fs.writeFileSync(csvPath, '');
        }

        // Sync
        await syncInventory();

        // Also remove from Mongo explicitly? Sync handles upsert, but what about delete?
        // Ah! syncInventory logic only UPSERTS. It does NOT delete products that are missing from CSV.
        // This is a flaw in the original sync logic (and my update).
        // I should probably fix syncInventory to handle deletions OR explicitly delete from Mongo here.
        // Explicit delete is safer/faster for this operation.
        await Product.findOneAndDelete({ id: req.params.id });

        // Audit
        const userEmail = req.headers['x-user-email'];
        await logAdminAction(userEmail, 'DELETE_PRODUCT_CSV', { category: req.params.category, id: req.params.id });

        res.json({ message: 'Product deleted' });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
