const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { Parser } = require('json2csv');
const csv = require('csv-parser');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { logAdminAction } = require('../utils/logger');
const updateCSV = require('../utils/updateCSV');

const upload = multer({ dest: 'uploads/' });

// Middleware for Admin Auth
const checkAuth = (req, res, next) => {
    const userEmail = req.headers['x-user-email'];
    // In production, use env vars. For now, hardcoded match with client.
    const admins = ['hritik@jps.com', 'admin@jps.com'];

    if (!userEmail || !admins.includes(userEmail)) {
        console.warn(`Unauthorized access attempt from: ${userEmail}`);
        return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    }
    next();
};

// Get all products
router.get('/', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Download CSV
router.get('/csv', async (req, res) => {
    try {
        const products = await Product.find().lean();

        // Flatten specs for CSV if needed, or just stringify
        const flattenedProducts = products.map(p => ({
            ...p,
            specs: p.specs ? JSON.stringify(p.specs) : '',
            images: p.images ? JSON.stringify(p.images) : ''
        }));

        const fields = ['id', 'name', 'price', 'stock', 'category', 'brand', 'image', 'images', 'specs', 'sold', 'available'];
        const json2csvParser = new Parser({ fields });
        const csvData = json2csvParser.parse(flattenedProducts);

        res.header('Content-Type', 'text/csv');
        res.attachment('inventory.csv');
        return res.send(csvData);
    } catch (err) {
        console.error('CSV Download Error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Upload CSV with Backup
router.post('/csv', checkAuth, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        // 1. Create Backup
        const currentProducts = await Product.find().lean();
        if (currentProducts.length > 0) {
            const flattenedProducts = currentProducts.map(p => ({
                ...p,
                specs: p.specs ? JSON.stringify(p.specs) : '',
                images: p.images ? JSON.stringify(p.images) : ''
            }));
            const fields = ['id', 'name', 'price', 'stock', 'category', 'brand', 'image', 'images', 'specs', 'sold', 'available'];
            const json2csvParser = new Parser({ fields });
            const csvData = json2csvParser.parse(flattenedProducts);

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = path.join(__dirname, '../backups', `inventory_BACKUP_${timestamp}.csv`);

            // Ensure backups dir exists (redundant check but safe)
            if (!fs.existsSync(path.join(__dirname, '../backups'))) {
                fs.mkdirSync(path.join(__dirname, '../backups'));
            }

            fs.writeFileSync(backupPath, csvData);
            console.log(`Backup created at: ${backupPath}`);
        }

        // 2. Process Uploaded CSV
        const results = [];
        fs.createReadStream(req.file.path)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                try {
                    // Update/Upsert products
                    for (const row of results) {
                        if (!row.id) continue;

                        // Parse complex fields back from string
                        const updateData = { ...row };
                        if (updateData.specs) {
                            try {
                                updateData.specs = JSON.parse(updateData.specs);
                            } catch (e) {
                                console.warn(`Failed to parse specs for ${row.id}`, e);
                                delete updateData.specs; // Keep existing or ignore
                            }
                        }
                        if (updateData.images) {
                            try {
                                updateData.images = JSON.parse(updateData.images);
                            } catch (e) {
                                console.warn(`Failed to parse images for ${row.id}`, e);
                                delete updateData.images;
                            }
                        }
                        // Convert types
                        if (updateData.price) updateData.price = Number(updateData.price);
                        if (updateData.stock) updateData.stock = Number(updateData.stock);
                        if (updateData.sold) updateData.sold = Number(updateData.sold);
                        if (updateData.available) updateData.available = updateData.available === 'true';

                        await Product.findOneAndUpdate(
                            { id: row.id },
                            updateData,
                            { upsert: true, new: true }
                        );
                    }

                    // Cleanup uploaded file
                    fs.unlinkSync(req.file.path);

                    // Audit Log
                    const userEmail = req.headers['x-user-email'];
                    await logAdminAction(userEmail, 'CSV_IMPORT', { count: results.length, backup: backupPath });

                    // Update local CSV
                    await updateCSV();

                    res.json({ message: 'Inventory updated successfully', backup: true });
                } catch (err) {
                    console.error('CSV Processing Error:', err);
                    res.status(500).json({ message: 'Error processing CSV data' });
                }
            });

    } catch (err) {
        console.error('CSV Upload Error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Get one product
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findOne({ id: req.params.id });
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create product
router.post('/', checkAuth, async (req, res) => {
    const product = new Product(req.body);
    try {
        const newProduct = await product.save();

        const userEmail = req.headers['x-user-email'];
        await logAdminAction(userEmail, 'CREATE_PRODUCT', { id: newProduct.id, name: newProduct.name });

        await updateCSV();

        res.status(201).json(newProduct);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update product
router.put('/:id', checkAuth, async (req, res) => {
    try {
        const updatedProduct = await Product.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });

        const userEmail = req.headers['x-user-email'];
        await logAdminAction(userEmail, 'UPDATE_PRODUCT', { id: req.params.id, updates: Object.keys(req.body) });

        await updateCSV();

        res.json(updatedProduct);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete product
router.delete('/:id', checkAuth, async (req, res) => {
    try {
        await Product.findOneAndDelete({ id: req.params.id });

        const userEmail = req.headers['x-user-email'];
        await logAdminAction(userEmail, 'DELETE_PRODUCT', { id: req.params.id });

        await updateCSV();

        res.json({ message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Batch Update Endpoint (JSON)
router.post('/batch', checkAuth, async (req, res) => {
    const { products } = req.body;
    if (!products || !Array.isArray(products)) {
        return res.status(400).json({ message: 'Invalid data format. Expected array of products.' });
    }

    // Create Backup
    const backupPath = path.join(__dirname, `../backups/inventory_${Date.now()}.json`);
    try {
        if (!fs.existsSync(path.join(__dirname, '../backups'))) {
            fs.mkdirSync(path.join(__dirname, '../backups'));
        }
        const currentProducts = await Product.find({});
        fs.writeFileSync(backupPath, JSON.stringify(currentProducts, null, 2));
    } catch (err) {
        console.error('Backup failed:', err);
        // Continue even if backup fails? Maybe warn.
    }

    let updatedCount = 0;
    let createdCount = 0;

    try {
        for (const p of products) {
            // Upsert
            const result = await Product.findOneAndUpdate(
                { id: p.id },
                p,
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            if (result.isNew) createdCount++;
            else updatedCount++;
        }

        const userEmail = req.headers['x-user-email'];
        await logAdminAction(userEmail, 'BATCH_UPDATE', { count: products.length, updated: updatedCount, created: createdCount });

        await updateCSV();

        res.json({
            message: `Batch update successful. Updated: ${updatedCount}, Created: ${createdCount}`,
            backup: true
        });
    } catch (err) {
        console.error('Batch update error:', err);
        res.status(500).json({ message: 'Batch update failed', error: err.message });
    }
});

module.exports = router;
