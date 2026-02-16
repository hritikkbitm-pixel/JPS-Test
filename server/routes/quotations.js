const express = require('express');
const router = express.Router();
const Quotation = require('../models/Quotation');
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
        const { items, customerName, customerEmail, customerPhone, notes, expiresAt, createdBy } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'At least one item is required' });
        }

        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const quotation = new Quotation({
            items,
            customerName,
            customerEmail,
            customerPhone,
            notes,
            total,
            expiresAt: expiresAt || null,
            createdBy: createdBy || ''
        });

        const saved = await quotation.save();
        res.status(201).json(saved);
    } catch (err) {
        console.error('Create quotation error:', err);
        res.status(500).json({ message: err.message });
    }
});

// List all quotations
router.get('/', async (req, res) => {
    try {
        const quotations = await Quotation.find().sort({ createdAt: -1 });
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

// Update quotation (admin)
router.put('/:id', async (req, res) => {
    try {
        const { items, customerName, customerEmail, customerPhone, notes, expiresAt } = req.body;
        const update = { customerName, customerEmail, customerPhone, notes, expiresAt };

        if (items && items.length > 0) {
            update.items = items;
            update.total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        }

        const q = await Quotation.findByIdAndUpdate(req.params.id, update, { new: true });
        if (!q) return res.status(404).json({ message: 'Quotation not found' });
        res.json(q);
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

// Delete quotation (admin)
router.delete('/:id', async (req, res) => {
    try {
        const q = await Quotation.findByIdAndDelete(req.params.id);
        if (!q) return res.status(404).json({ message: 'Quotation not found' });
        res.json({ message: 'Quotation deleted' });
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
            status: q.status
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

        res.json({ success: true, message: 'Payment verified and quotation marked as paid' });
    } catch (err) {
        console.error('Quotation payment verification error:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
