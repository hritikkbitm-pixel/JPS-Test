const express = require('express');
const router = express.Router();
const Quotation = require('../models/Quotation');
const Order = require('../models/Order');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
}

// ─── Admin Routes ───

// Create quotation
router.post('/', async (req, res) => {
    try {
        const { items, customerName, customerEmail, customerPhone, customerAddress, notes, expiresAt, createdBy, gstEnabled, gstin, quotationDate } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'At least one item is required' });
        }

        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const quotation = new Quotation({
            items,
            customerName,
            customerEmail,
            customerPhone,
            customerAddress: customerAddress || {},
            notes,
            total,
            expiresAt: expiresAt || null,
            createdBy: createdBy || '',
            gstEnabled: gstEnabled || false,
            gstin: gstin || '',
            quotationDate: quotationDate ? new Date(quotationDate) : new Date()
        });

        const saved = await quotation.save();
        res.status(201).json(saved);
    } catch (err) {
        console.error('Create quotation error:', err);
        res.status(500).json({ message: err.message });
    }
});

// List quotations (supports ?archived=true)
router.get('/', async (req, res) => {
    try {
        const { archived } = req.query;
        let filter = {};
        if (archived === 'true') {
            filter.status = { $in: ['cancelled', 'expired'] };
        } else {
            filter.status = { $nin: ['cancelled', 'expired'] };
        }
        const quotations = await Quotation.find(filter).sort({ createdAt: -1 });
        res.json(quotations);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get single quotation by ID (admin)
router.get('/:id', async (req, res) => {
    try {
        const q = await Quotation.findById(req.params.id);
        if (!q) return res.status(404).json({ message: 'Quotation not found' });
        res.json(q);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update quotation (admin) — with edit history
router.put('/:id', async (req, res) => {
    try {
        const { items, customerName, customerEmail, customerPhone, customerAddress, notes, expiresAt, gstEnabled, gstin, editedBy, quotationDate } = req.body;

        const q = await Quotation.findById(req.params.id);
        if (!q) return res.status(404).json({ message: 'Quotation not found' });

        // Build changes summary
        const changes = [];
        if (customerName !== undefined && customerName !== q.customerName) changes.push('customer name');
        if (customerEmail !== undefined && customerEmail !== q.customerEmail) changes.push('email');
        if (customerPhone !== undefined && customerPhone !== q.customerPhone) changes.push('phone');
        if (customerAddress !== undefined) changes.push('address');
        if (notes !== undefined && notes !== q.notes) changes.push('notes');
        if (expiresAt !== undefined) changes.push('expiry');
        if (gstEnabled !== undefined && gstEnabled !== q.gstEnabled) changes.push('GST');
        if (gstin !== undefined && gstin !== q.gstin) changes.push('GSTIN');
        if (items && items.length > 0) changes.push('items/pricing');
        if (quotationDate !== undefined) changes.push('quotation date');

        // Apply updates
        if (customerName !== undefined) q.customerName = customerName;
        if (customerEmail !== undefined) q.customerEmail = customerEmail;
        if (customerPhone !== undefined) q.customerPhone = customerPhone;
        if (customerAddress !== undefined) q.customerAddress = customerAddress;
        if (notes !== undefined) q.notes = notes;
        if (expiresAt !== undefined) q.expiresAt = expiresAt;
        if (gstEnabled !== undefined) q.gstEnabled = gstEnabled;
        if (gstin !== undefined) q.gstin = gstin;
        if (quotationDate !== undefined) q.quotationDate = new Date(quotationDate);

        if (items && items.length > 0) {
            q.items = items;
            q.total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        }

        // Log edit
        if (changes.length > 0) {
            q.editHistory.push({
                editedAt: new Date(),
                editedBy: editedBy || 'Admin',
                changes: `Updated: ${changes.join(', ')}`
            });
        }

        const saved = await q.save();
        res.json(saved);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Change quotation status (admin cancel/expire)
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        if (!['draft', 'sent', 'paid', 'expired', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        const q = await Quotation.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!q) return res.status(404).json({ message: 'Quotation not found' });
        res.json(q);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Restore archived quotation
router.put('/:id/restore', async (req, res) => {
    try {
        const q = await Quotation.findById(req.params.id);
        if (!q) return res.status(404).json({ message: 'Quotation not found' });
        if (!['cancelled', 'expired'].includes(q.status)) {
            return res.status(400).json({ message: 'Only cancelled or expired quotations can be restored' });
        }
        q.status = 'draft';
        q.editHistory.push({
            editedAt: new Date(),
            editedBy: 'Admin',
            changes: `Restored from ${q.status}`
        });
        const saved = await q.save();
        res.json(saved);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Permanent delete (only archived)
router.delete('/:id/permanent', async (req, res) => {
    try {
        const q = await Quotation.findById(req.params.id);
        if (!q) return res.status(404).json({ message: 'Quotation not found' });
        if (!['cancelled', 'expired'].includes(q.status)) {
            return res.status(400).json({ message: 'Only cancelled or expired quotations can be permanently deleted' });
        }
        await Quotation.findByIdAndDelete(req.params.id);
        res.json({ message: 'Quotation permanently deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete quotation (admin — soft: sets to cancelled)
router.delete('/:id', async (req, res) => {
    try {
        const q = await Quotation.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { new: true });
        if (!q) return res.status(404).json({ message: 'Quotation not found' });
        res.json({ message: 'Quotation moved to archive' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── Public Routes (Customer Payment) ───

// Get quotation by token (public — customer facing)
router.get('/pay/:token', async (req, res) => {
    try {
        const q = await Quotation.findOne({ token: req.params.token });
        if (!q) return res.status(404).json({ message: 'Quotation not found' });

        // Check expired
        if (q.isExpired()) {
            if (q.status === 'sent') {
                q.status = 'expired';
                await q.save();
            }
            return res.status(410).json({ message: 'This quotation has expired', status: 'expired' });
        }

        if (q.status !== 'sent') {
            return res.status(410).json({
                message: q.status === 'paid' ? 'This quotation has already been paid' : 'This quotation is no longer valid',
                status: q.status
            });
        }

        // Return safe subset for customer
        res.json({
            token: q.token,
            items: q.items,
            total: q.total,
            customerName: q.customerName,
            notes: q.notes,
            expiresAt: q.expiresAt,
            status: q.status,
            gstEnabled: q.gstEnabled,
            gstin: q.gstin
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create Razorpay order for quotation
router.post('/pay/:token/order', async (req, res) => {
    try {
        if (!razorpay) {
            return res.status(503).json({ message: 'Payment service not configured' });
        }

        const q = await Quotation.findOne({ token: req.params.token });
        if (!q) return res.status(404).json({ message: 'Quotation not found' });

        if (q.status !== 'sent') {
            return res.status(410).json({ message: 'This quotation is no longer valid' });
        }

        if (q.isExpired()) {
            q.status = 'expired';
            await q.save();
            return res.status(410).json({ message: 'This quotation has expired' });
        }

        const options = {
            amount: Math.round(q.total * 100), // paise
            currency: 'INR',
            receipt: `quote_${q.token.substring(0, 8)}`,
            notes: {
                quotation_token: q.token,
                customer_name: q.customerName
            }
        };

        const order = await razorpay.orders.create(options);
        res.json({
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: process.env.RAZORPAY_KEY_ID
        });
    } catch (err) {
        console.error('Quotation Razorpay order error:', err);
        const errorMsg = err?.error?.description || err?.message || 'Failed to create payment order';
        res.status(err?.statusCode || 500).json({ message: errorMsg });
    }
});

// Verify payment and mark quotation as paid
router.post('/pay/:token/complete', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!process.env.RAZORPAY_KEY_SECRET) {
            return res.status(503).json({ message: 'Payment service not configured' });
        }

        // Verify signature
        const sign = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(sign)
            .digest('hex');

        if (razorpay_signature !== expectedSign) {
            return res.status(400).json({ message: 'Invalid payment signature' });
        }

        const q = await Quotation.findOne({ token: req.params.token });
        if (!q) return res.status(404).json({ message: 'Quotation not found' });

        if (q.status !== 'sent') {
            return res.status(410).json({ message: 'This quotation is no longer valid' });
        }

        q.status = 'paid';
        q.paymentDetails = { razorpay_order_id, razorpay_payment_id, razorpay_signature };
        await q.save();

        // ─── Create Order from Quotation ───
        try {
            const addr = q.customerAddress || {};
            const newOrder = new Order({
                id: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                email: q.customerEmail || 'guest@jps.com',
                date: new Date().toLocaleString('en-IN'),
                items: q.items.map(item => ({
                    id: item.productId || `custom-${Date.now()}`,
                    name: item.name,
                    category: item.category || 'Custom',
                    price: item.price,
                    brand: item.brand || 'Custom',
                    image: item.image || '',
                    specs: {},
                    stock: item.quantity,
                    sold: 0,
                    available: true,
                    unavailable: false
                })),
                total: q.total,
                status: 'Processing',
                shippingAddress: {
                    fullName: q.customerName,
                    label: 'Quotation',
                    line1: addr.street || '',
                    line2: '',
                    city: addr.city || '',
                    zip: addr.pinCode || '',
                    state: addr.state || '',
                    phone: q.customerPhone
                },
                paymentMethod: 'Online (Razorpay - Quotation)',
                isGuestOrder: true,
                whatsappNumber: q.customerPhone,
                messages: [{
                    text: `Order created from Paid Quotation #${q.token.substring(0, 8)}`,
                    date: new Date().toLocaleString('en-IN'),
                    sender: 'System'
                }],
                fromQuotation: true,
                quotationToken: q.token
            });

            await newOrder.save();
            console.log(`Order created for quotation ${q.token}`);
        } catch (orderErr) {
            console.error('Failed to auto-create order for quotation:', orderErr);
        }

        res.json({ success: true, message: 'Payment verified and quotation marked as paid' });
    } catch (err) {
        console.error('Quotation payment verification error:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
