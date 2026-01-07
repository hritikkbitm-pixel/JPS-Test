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
    else if (cat === 'mouse' || cat === 'mice') filename = 'mice.csv';
    else if (cat === 'keyboard' || cat === 'keyboards') filename = 'keyboards.csv';
    else if (cat === 'laptop' || cat === 'laptops') filename = 'laptops.csv';
    else if (cat === 'monitor' || cat === 'monitors') filename = 'monitors.csv';
    else if (cat === 'headset') filename = 'headset.csv';
    else if (cat === 'webcam') filename = 'webcam.csv';
    else if (cat === 'gamepad') filename = 'gamepad.csv';
    else if (cat === 'steering-wheel') filename = 'steering-wheel.csv';
    else if (cat === 'gaming-accessories') filename = 'gaming-accessories.csv';
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

// Transform Lenovo vendor CSV row to Product schema
const transformLenovoRow = (row) => {
    // Helper to get value (handles quoted keys from csv-parser)
    const get = (key) => row[key] || row[`"${key}"`] || '';

    // Helper to get first non-empty value from multiple possible keys
    const getFirst = (...keys) => {
        for (const key of keys) {
            const val = get(key);
            if (val) return val;
        }
        return '';
    };

    const series = get('Series');
    const mtm = get('MTM');

    // Price can be in different columns depending on CSV format
    const priceStr = getFirst('Adjusted_Final_Price', 'final-price', 'Original_Final_Price', 'Final_Price');
    const price = Number(priceStr?.toString().replace(/[^0-9.]/g, '') || 0);

    return {
        id: get('id') || `lenovo_${mtm.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        name: `Lenovo ${series} ${mtm}`.trim(),
        brand: 'Lenovo',
        category: 'laptop',
        price: price,
        image: getFirst('Image', 'image', 'image-src', 'image_src'),
        stock: 10,
        available: true,
        sold: 0,
        specs: {
            series: series,
            mtm: mtm,
            form_factor: get('Form Factor'),
            cpu: get('CPU'),
            ai_pc: get('AI PC'),
            ram_storage: get('RAM/HDD'),
            os: get('Operating System'),
            office: get('Office'),
            gpu: get('Graphics'),
            display: get('Display'),
            color: get('Color'),
            weight: get('Weight'),
            carrycase: get('Carrycase MTM'),
            warranty: get('Warranty'),
            warranty_addon: get('Additional Warranty Offering'),
            adp: get('ADP Additional'),
            keyboard: get('Keyboard'),
            login_option: get('Login Option'),
            segment: get('Segment Type'),
        }
    };
};

// Upload Lenovo Vendor CSV - special schema mapping
// Add ?clear=true query param to delete existing Lenovo laptops before import
router.post('/cat/laptops/lenovo/csv', checkAuth, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        // Check if clear option is requested
        const clearExisting = req.query.clear === 'true';
        let deletedCount = 0;

        if (clearExisting) {
            // Delete all existing Lenovo laptops
            const deleteResult = await Product.deleteMany({
                brand: 'Lenovo',
                category: 'laptop'
            });
            deletedCount = deleteResult.deletedCount || 0;
            console.log(`🗑️ Cleared ${deletedCount} existing Lenovo laptops`);
        }

        // Parse CSV - handle vendor files with leading blank/title rows
        const rawResults = [];
        await new Promise((resolve, reject) => {
            fs.createReadStream(req.file.path)
                .pipe(csv({ headers: false })) // Read without headers first
                .on('data', (data) => rawResults.push(data))
                .on('end', resolve)
                .on('error', reject);
        });

        // Clean up temp file
        fs.unlinkSync(req.file.path);

        // Find actual data rows and map columns
        // Expected columns at positions: 1:Series, 2:FormFactor, 3:MTM, 4:CPU, 5:AI_PC, 6:RAM/HDD, 
        // 7:OS, 8:Office, 9:Graphics, 10:Display, 11:Color, 12:Weight, 13:Carrycase, 14:Warranty,
        // 15:WarrantyAddon, 16:ADP, 17:Keyboard, 18:LoginOption, 19:Segment, 20:T3billing, 
        // 21:Activation, 22:NLC, 23:Price, 24:Image
        const results = [];
        for (const row of rawResults) {
            const vals = Object.values(row);
            // Skip empty rows, title rows, and header rows
            if (!vals[3] || vals[3] === 'MTM' || String(vals[3]).includes('Lenovo')) continue;

            // Map by position (0-indexed, column 0 is empty)
            const mappedRow = {
                'Series': vals[1] || '',
                'Form Factor': vals[2] || '',
                'MTM': vals[3] || '',
                'CPU': vals[4] || '',
                'AI PC': vals[5] || '',
                'RAM/HDD': vals[6] || '',
                'Operating System': vals[7] || '',
                'Office': vals[8] || '',
                'Graphics': vals[9] || '',
                'Display': vals[10] || '',
                'Color': vals[11] || '',
                'Weight': vals[12] || '',
                'Carrycase MTM': vals[13] || '',
                'Warranty': vals[14] || '',
                'Additional Warranty Offering': vals[15] || '',
                'ADP Additional': vals[16] || '',
                'Keyboard': vals[17] || '',
                'Login Option': vals[18] || '',
                'Segment Type': vals[19] || '',
                'Adjusted_Final_Price': vals[23] || vals[20] || '', // Try col 23 first, then 20
                'Image': vals[24] || '',
            };
            results.push(mappedRow);
        }

        if (results.length === 0) {
            return res.status(400).json({ message: 'CSV file is empty or has no valid product rows' });
        }

        console.log(`📦 Processing ${mappedRows.length} Lenovo products from CSV`);

        // Transform and upsert to MongoDB
        const productsToProcess = [];
        for (const row of mappedRows) {
            const product = transformLenovoRow(row);
            if (product.id) { // Only add if a valid ID was generated
                productsToProcess.push(product);
            }
        }

        let inserted = 0;
        let updated = 0;

        for (const product of productsToProcess) {
            const existing = await Product.findOne({
                $or: [
                    { id: product.id },
                    { name: product.name }
                ]
            });

            if (existing) {
                Object.assign(existing, product);
                await existing.save();
                updated++;
            } else {
                await Product.create(product);
                inserted++;
            }
        }

        // Audit
        const userEmail = req.headers['x-user-email'];
        await logAdminAction(userEmail, 'UPLOAD_LENOVO_CSV', { count: productsToProcess.length });

        res.json({
            message: 'Lenovo CSV processed successfully',
            inserted,
            updated,
            deleted: deletedCount
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// Transform HP Laptop CSV row to Product schema
const transformHpRow = (row) => {
    // Helper to get value (handles quoted keys from csv-parser)
    const get = (key) => row[key] || row[`"${key}"`] || '';

    const model = get('Model');
    const partNo = get('Part no.');
    const subBrand = get('Sub Brand');

    // Parse prices - remove any non-numeric characters
    const finalPriceStr = get('Final Price')?.toString().replace(/[^0-9.]/g, '') || '0';
    const mrpStr = get('MRP')?.toString().replace(/[^0-9.]/g, '') || '0';
    const finalPrice = Number(finalPriceStr) || 0;
    const mrp = Number(mrpStr) || 0;

    // Generate ID from part number
    const id = partNo ? `hp_${partNo.toLowerCase().replace(/[^a-z0-9]/g, '_')}` : `hp_${model.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    // Build rich description from features
    const features = get('Features');
    const description = features || '';

    return {
        id: id,
        name: model.startsWith('HP') ? model : `HP ${model}`.trim(),
        brand: 'HP',
        category: 'laptop',
        price: finalPrice,
        mrp: mrp > 0 ? mrp : undefined,
        image: get('Image') || '',
        stock: 10,
        available: true,
        sold: 0,
        description: description,
        specs: {
            sub_brand: subBrand,
            part_no: partNo,
            processor: get('Processor'),
            ram: get('RAM'),
            storage: get('Storage'),
            graphics: get('Graphics'),
            os: get('OS/MSO'),
            features: features,
            display: get('Display'),
            color: get('Colour'),
            warranty: get('Service'),
            segment: get('Category'), // Premium/Super Premium
        }
    };
};

// Upload HP Laptop CSV - special schema mapping
// Add ?clear=true query param to delete existing HP laptops before import
router.post('/cat/laptops/hp/csv', checkAuth, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        // Check if clear option is requested
        const clearExisting = req.query.clear === 'true';
        let deletedCount = 0;

        if (clearExisting) {
            // Delete all existing HP laptops
            const deleteResult = await Product.deleteMany({
                brand: 'HP',
                category: 'laptop'
            });
            deletedCount = deleteResult.deletedCount || 0;
            console.log(`🗑️ Cleared ${deletedCount} existing HP laptops`);
        }

        // Parse CSV - HP file has proper headers
        const results = [];
        await new Promise((resolve, reject) => {
            fs.createReadStream(req.file.path)
                .pipe(csv())
                .on('data', (data) => {
                    // Skip empty rows
                    const model = data['Model'];
                    if (model && model.trim()) {
                        results.push(transformHpRow(data));
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });

        // Clean up temp file
        fs.unlinkSync(req.file.path);

        if (results.length === 0) {
            return res.status(400).json({ message: 'CSV file is empty or has no valid product rows' });
        }

        console.log(`📦 Processing ${results.length} HP laptops from CSV`);

        let inserted = 0;
        let updated = 0;

        for (const product of results) {
            // Skip products without valid price
            if (!product.price || product.price === 0) continue;

            const existing = await Product.findOne({
                $or: [
                    { id: product.id },
                    { name: product.name }
                ]
            });

            if (existing) {
                Object.assign(existing, product);
                await existing.save();
                updated++;
            } else {
                await Product.create(product);
                inserted++;
            }
        }

        // Audit
        const userEmail = req.headers['x-user-email'];
        await logAdminAction(userEmail, 'UPLOAD_HP_CSV', { count: results.length });

        res.json({
            message: 'HP Laptops imported successfully',
            inserted,
            updated,
            deleted: deletedCount
        });
    } catch (err) {
        console.error(err);
        // Clean up temp file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: err.message });
    }
});

// Transform BenQ Monitor CSV row to Product schema
const transformBenqMonitorRow = (row) => {
    // Helper to get value (handles quoted keys from csv-parser)
    const get = (key) => row[key] || row[`"${key}"`] || '';

    // Description is basically the specs string
    const description = get('description');

    return {
        id: `benq_${get('model').toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        name: get('product_name') || `BenQ ${get('model')} Monitor`,
        brand: 'BenQ',
        category: 'monitor',
        price: Number(get('price') || 0),
        image: get('image') || '',
        stock: Number(get('stock') || 10),
        available: true,
        sold: 0,
        description: description, // Used for short description/key features
        specs: {
            model: get('model'),
            features: description // Also store in specs if needed specifically
        }
    };
};

// Transform Logitech Product CSV row to Product schema
const transformLogitechRow = (row, category) => {
    // Helper to get value (handles quoted keys from csv-parser)
    const get = (key) => row[key] || row[`"${key}"`] || '';

    let productName = get('Product Name');

    // 1. Clean up product name - remove suffixes like " - APANZ-122", " - US", etc.
    let cleanName = productName
        .replace(/ - [A-Z0-9\+\-\/\#\s]+-\d+$/g, '')
        .replace(/ - [A-Z]{2,5}$/g, '')
        .replace(/Â¬Ã†/g, '')
        .replace(/â‚¬/g, '')
        .replace(/â€šǹìƒâ¢/g, '')
        .trim();

    // 2. Parse prices
    const finalPriceStr = get('Final Price')?.toString().replace(/[^0-9.]/g, '') || '0';
    const mrpRashiStr = get('MRP Rashi')?.toString().replace(/[^0-9.]/g, '') || '0';
    const mrpSupertronStr = get('MRP Supertron')?.toString().replace(/[^0-9.]/g, '') || '0';

    const finalPrice = Number(finalPriceStr) || 0;
    const mrp = Math.max(Number(mrpRashiStr) || 0, Number(mrpSupertronStr) || 0);

    // 3. Availability
    const isAvailable = get('Rashi Available') === 'YES' || get('Supertron Available') === 'YES' || get('Available') === 'YES' || get('stock_status') === 'In Stock';

    // 4. Generate ID
    const partCode = get('Part Code') || get('Part no.');
    const id = partCode ? `logi_${partCode.toLowerCase().replace(/[^a-z0-9]/g, '_')}` : `logi_${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    return {
        id: id,
        name: cleanName,
        brand: 'Logitech',
        category: category,
        price: finalPrice,
        mrp: mrp > finalPrice ? mrp : undefined,
        image: get('Image') || '',
        stock: 10,
        available: isAvailable,
        sold: 0,
        description: get('Short Description') || '',
        specs: {
            part_code: partCode,
            warranty: get('Warranty'),
            key_features: get('Key Features'),
            long_description: get('Long Description'),
            hierarchy_2: get('Hierarchy 2'),
            hierarchy_3: get('Hierarchy 3'),
            strategic_pillar: get('Strategic Pillar'),
        }
    };
};

// Upload Logitech CSV - special schema mapping
router.post('/cat/logitech/csv', checkAuth, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const category = req.query.category || 'mouse';

    try {
        const results = [];
        await new Promise((resolve, reject) => {
            fs.createReadStream(req.file.path)
                .pipe(csv())
                .on('data', (data) => {
                    const productName = data['Product Name'];
                    if (productName && productName.trim()) {
                        results.push(transformLogitechRow(data, category));
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });

        fs.unlinkSync(req.file.path);

        if (results.length === 0) {
            return res.status(400).json({ message: 'CSV file is empty or has no valid product rows' });
        }

        console.log(`📦 Processing ${results.length} Logitech products from CSV`);

        let inserted = 0;
        let updated = 0;

        for (const product of results) {
            if (!product.price || product.price === 0) continue;

            const existing = await Product.findOne({ id: product.id });

            if (existing) {
                Object.assign(existing, product);
                await existing.save();
                updated++;
            } else {
                await Product.create(product);
                inserted++;
            }
        }

        const userEmail = req.headers['x-user-email'];
        await logAdminAction(userEmail, 'UPLOAD_LOGITECH_CSV', { category, count: results.length });

        res.json({
            message: `Logitech ${category}s imported successfully`,
            inserted,
            updated
        });
    } catch (err) {
        console.error(err);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ message: err.message });
    }
});

// Upload Category CSV - writes directly to MongoDB (not file system)
router.post('/cat/:category/csv', checkAuth, upload.single('file'), async (req, res) => {
    const category = req.params.category.toLowerCase();

    // Map category names to database category values
    let dbCategory = category;
    if (category === 'cpus' || category === 'cpu') dbCategory = 'cpu';
    else if (category === 'motherboards' || category === 'motherboard') dbCategory = 'motherboard';
    else if (category === 'gpus' || category === 'gpu') dbCategory = 'gpu';
    else if (category === 'cabinets' || category === 'case') dbCategory = 'case';
    else if (category === 'coolers' || category === 'cooler' || category === 'cooling') dbCategory = 'cooling';
    else if (category === 'mice' || category === 'mouse') dbCategory = 'mouse';
    else if (category === 'keyboards' || category === 'keyboard') dbCategory = 'keyboard';
    else if (category === 'laptops' || category === 'laptop') dbCategory = 'laptop';
    else if (category === 'monitors' || category === 'monitor') dbCategory = 'monitor';
    else if (category === 'ram') dbCategory = 'ram';
    else if (category === 'storage') dbCategory = 'storage';
    else if (category === 'psu') dbCategory = 'psu';

    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        // Parse CSV directly from uploaded file
        const results = [];
        await new Promise((resolve, reject) => {
            fs.createReadStream(req.file.path)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', resolve)
                .on('error', reject);
        });

        // Clean up temp file
        fs.unlinkSync(req.file.path);

        if (results.length === 0) {
            return res.status(400).json({ message: 'CSV file is empty or invalid' });
        }

        // Transform and upsert to MongoDB
        const bulkOps = [];
        for (const row of results) {
            const id = row.id || row['"id"'];
            if (!id) continue;

            const updateData = {
                id: id,
                category: dbCategory,
                brand: row.brand || row['"brand"'] || '',
                sold: Number(row.sold || row['"sold"']) || 0,
                available: (row.stock_status || row['"stock_status"']) === 'In Stock',
                stock: (row.stock_status || row['"stock_status"']) === 'In Stock' && !Number(row.stock || row['"stock"']) ? 10 : Number(row.stock || row['"stock"'] || 0),
                price: Number((row.price || row['"price"'])?.toString().replace(/[^0-9.]/g, '') || 0),
                mrp: Number((row.mrp || row['"mrp"'])?.toString().replace(/[^0-9.]/g, '') || 0) || undefined,
                name: row.name || row['"name"'] || row.full_name || row['"full_name"'] || row.product_name || row['"product_name"'] || id,
                image: row.image || row['"image"'] || row.image_url || row['"image_url"'] || row.product_image || row['"product_image"'] || '',
            };

            // Populate specs from remaining fields
            const coreFields = ['id', 'name', 'full_name', 'price', 'mrp', 'stock', 'stock_status', 'category', 'brand', 'image', 'image_url', 'images', 'sold', 'available'];
            const specs = {};
            Object.keys(row).forEach(key => {
                const cleanKey = key.replace(/"/g, '');
                if (!coreFields.includes(cleanKey)) {
                    specs[cleanKey] = row[key];
                }
            });
            updateData.specs = specs;

            bulkOps.push({
                updateOne: {
                    filter: { id: id },
                    update: { $set: updateData },
                    upsert: true
                }
            });
        }

        if (bulkOps.length > 0) {
            await Product.bulkWrite(bulkOps);
        }

        // Audit
        const userEmail = req.headers['x-user-email'];
        await logAdminAction(userEmail, 'UPLOAD_CSV', { category: dbCategory, count: bulkOps.length });

        res.json({ message: `Successfully imported ${bulkOps.length} products to database.` });
    } catch (err) {
        console.error('Upload CSV Error:', err);
        // Clean up temp file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: err.message });
    }
});

// Update Row in Category CSV
router.put('/cat/:category/:id', checkAuth, async (req, res) => {
    const { category, id } = req.params;
    const updateData = req.body;

    try {
        // 1. Update MongoDB directly - this is the primary source of truth now
        const updatedProduct = await Product.findOneAndUpdate(
            { id: id },
            { $set: updateData },
            { new: true, upsert: true }
        );

        // 2. Sync to Category CSV for persistence if it exists
        const csvPath = getCsvPath(category);
        if (csvPath && fs.existsSync(csvPath)) {
            const rows = [];
            await new Promise((resolve, reject) => {
                const stream = fs.createReadStream(csvPath)
                    .pipe(csv())
                    .on('data', row => rows.push(row))
                    .on('end', resolve)
                    .on('error', reject);
            });

            const index = rows.findIndex(r => (r.id || r['"id"']) === id);

            // Prepare CSV-safe data (flatten if necessary, though mostly it is)
            const csvRow = { ...updateData };
            // If specs is an object, we don't want to stringify it into a single cell usually, 
            // but for simple sync back, we'll just keep the top level fields.
            if (typeof csvRow.specs === 'object') delete csvRow.specs;

            if (index !== -1) {
                rows[index] = { ...rows[index], ...csvRow };
            } else {
                // Product was in Mongo but not in this CSV, add it.
                rows.push({ id: id, ...csvRow });
            }

            // Write back to CSV
            if (rows.length > 0) {
                const json2csvParser = new Parser({ fields: Object.keys(rows[0]) });
                const csvData = json2csvParser.parse(rows);
                fs.writeFileSync(csvPath, csvData);
            }
        }

        // Audit
        const userEmail = req.headers['x-user-email'];
        await logAdminAction(userEmail, 'UPDATE_PRODUCT', { category, id });

        res.json(updatedProduct);

    } catch (err) {
        console.error('Update Product Error:', err);
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

// Transform MSI CSV row to Product schema
const transformMsiRow = (row, category) => {
    // Helper to get value (handles quoted keys from csv-parser)
    const get = (key) => row[key] || row[`"${key}"`] || '';

    const id = get('id');
    const name = get('name');
    const brand = get('brand') || 'MSI';

    // Parse prices - MSI CSV has 'price' (landing) and 'final_price' (selling)
    const finalPriceStr = get('final_price')?.toString().replace(/[^0-9.]/g, '') || '0';
    const landingPriceStr = get('price')?.toString().replace(/[^0-9.]/g, '') || '0';
    const finalPrice = Number(finalPriceStr) || 0;
    const landingPrice = Number(landingPriceStr) || 0;

    const image = get('image') || '';
    const availability = get('Availability');

    // Combine descriptions
    const desc1 = get('description_1');
    const desc2 = get('description_2');
    const description = [desc1, desc2].filter(Boolean).join('\n\n');

    // All other fields go into specs
    const coreFields = ['id', 'name', 'brand', 'Availability', 'price', 'final_price', 'image', 'description_1', 'description_2'];
    const specs = {};
    Object.keys(row).forEach(key => {
        const cleanKey = key.replace(/"/g, '');
        if (!coreFields.includes(cleanKey)) {
            specs[cleanKey] = row[key];
        }
    });

    // Add landing price and combined description to specs for compatibility
    specs.landing_price = landingPrice;
    specs.msi_description = description;

    // Map category
    let dbCategory = category.toLowerCase();
    if (dbCategory === 'cabinet' || dbCategory === 'case') dbCategory = 'case';
    if (dbCategory === 'cooler' || dbCategory === 'cooling') dbCategory = 'cooling';
    if (dbCategory === 'ssd' || dbCategory === 'storage') dbCategory = 'storage';

    return {
        id: id,
        name: name,
        brand: brand,
        category: dbCategory,
        price: finalPrice,
        image: image,
        stock: 10,
        available: availability === 'Avl' || availability === 'In Stock',
        sold: 0,
        specs: specs
    };
};

// MSI Specialized Import (Processes files from /server/data/products/msi/)
router.post('/msi/import', checkAuth, async (req, res) => {
    const { category } = req.body;
    if (!category) return res.status(400).json({ message: 'Category is required' });

    let filename = '';
    const cat = category.toLowerCase();

    // Map selecting category to correct MSI CSV filename
    if (cat === 'motherboard') filename = 'msi-motherboard.csv';
    else if (cat === 'gpu') filename = 'msi-gpu.csv';
    else if (cat === 'case' || cat === 'cabinet') filename = 'msi-cabinet.csv';
    else if (cat === 'cooling' || cat === 'cooler') filename = 'msi-cooler.csv';
    else if (cat === 'monitor') filename = 'msi-monitor.csv';
    else if (cat === 'psu') filename = 'msi-psu.csv';
    else if (cat === 'storage' || cat === 'ssd') filename = 'msi-ssd.csv';
    else return res.status(400).json({ message: `No MSI import data for category: ${category}` });

    const msiDataDir = path.join(__dirname, '../data/products/msi');
    const csvPath = path.join(msiDataDir, filename);

    if (!fs.existsSync(csvPath)) {
        return res.status(404).json({ message: `MSI CSV for ${category} not found at ${csvPath}` });
    }

    try {
        const results = [];
        await new Promise((resolve, reject) => {
            fs.createReadStream(csvPath)
                .pipe(csv())
                .on('data', (data) => {
                    const transformed = transformMsiRow(data, cat);
                    if (transformed.id) results.push(transformed);
                })
                .on('end', resolve)
                .on('error', reject);
        });

        if (results.length === 0) {
            return res.status(400).json({ message: 'CSV file is empty or invalid' });
        }

        const bulkOps = results.map(product => ({
            updateOne: {
                filter: { id: product.id },
                update: { $set: product },
                upsert: true
            }
        }));

        await Product.bulkWrite(bulkOps);

        const userEmail = req.headers['x-user-email'];
        await logAdminAction(userEmail, 'IMPORT_MSI_CATEGORY', { category: cat, count: results.length });

        res.json({
            message: `Successfully imported ${results.length} MSI ${category} items to database.`,
            count: results.length
        });
    } catch (err) {
        console.error('MSI Import Error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Logitech Specialized Import (Processes files from /server/data/products/logitech/)
router.post('/logitech/import', checkAuth, async (req, res) => {
    const { category } = req.body;
    if (!category) return res.status(400).json({ message: 'Category is required' });

    let filename = '';
    const cat = category.toLowerCase();

    // Map selecting category to correct Logitech CSV filename
    if (cat === 'headset') filename = 'logitech-headset.csv';
    else if (cat === 'webcam') filename = 'logitech-webcam.csv';
    else if (cat === 'gamepad') filename = 'logitech-gamepad.csv';
    else if (cat === 'steering-wheel') filename = 'logitech-steering-wheel.csv';
    else if (cat === 'gaming-accessories') filename = 'logitech-gaming-accessories.csv';
    else if (cat === 'mouse' || cat === 'mice') filename = 'logitech-mice.csv';
    else if (cat === 'keyboard' || cat === 'keyboards') filename = 'logitech-keyboard.csv';
    else return res.status(400).json({ message: `No Logitech import data for category: ${category}` });

    const logitechDataDir = path.join(__dirname, '../data/products/logitech');
    const csvPath = path.join(logitechDataDir, filename);

    if (!fs.existsSync(csvPath)) {
        return res.status(404).json({ message: `Logitech CSV for ${category} not found at ${csvPath}` });
    }

    try {
        const results = [];
        await new Promise((resolve, reject) => {
            fs.createReadStream(csvPath)
                .pipe(csv())
                .on('data', (data) => {
                    if (data['Product Name']) {
                        results.push(transformLogitechRow(data, cat));
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });

        if (results.length === 0) {
            return res.status(400).json({ message: 'CSV file is empty or invalid' });
        }

        const bulkOps = results.map(product => ({
            updateOne: {
                filter: { id: product.id },
                update: { $set: product },
                upsert: true
            }
        }));

        await Product.bulkWrite(bulkOps);

        const userEmail = req.headers['x-user-email'];
        await logAdminAction(userEmail, 'IMPORT_LOGITECH_CATEGORY', { category: cat, count: results.length });

        res.json({
            message: `Successfully imported ${results.length} Logitech ${category} items to database.`,
            count: results.length
        });
    } catch (err) {
        console.error('Logitech Import Error:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
