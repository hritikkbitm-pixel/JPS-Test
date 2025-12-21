const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');

// Initialize Razorpay only if credentials are present
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log('Razorpay initialized successfully');
} else {
    console.warn('WARNING: Razorpay credentials not found. Payment features will be disabled.');
}

exports.createRazorpayOrder = async (req, res) => {
    try {
        if (!razorpay) {
            return res.status(503).json({
                success: false,
                message: 'Payment service not configured. Please contact support.'
            });
        }

        const { amount, currency, receipt, notes } = req.body;

        if (!amount) {
            return res.status(400).json({ message: 'Amount is required' });
        }

        const options = {
            amount: Math.round(amount * 100), // Razorpay expects amount in subunits (paise)
            currency: currency || 'INR',
            receipt: receipt || `receipt_${Date.now()}`,
            notes: notes || {}
        };

        const order = await razorpay.orders.create(options);

        res.status(200).json({
            success: true,
            order_id: order.id,
            amount: order.amount,
            currency: order.currency
        });
    } catch (error) {
        console.error('Razorpay Order Creation Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create Razorpay order',
            error: error.message
        });
    }
};

exports.verifyRazorpayPayment = async (req, res) => {
    try {
        if (!process.env.RAZORPAY_KEY_SECRET) {
            return res.status(503).json({
                success: false,
                message: 'Payment service not configured. Please contact support.'
            });
        }

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            // Payment is verified
            if (orderId) {
                const updatedOrder = await Order.findOneAndUpdate(
                    { id: orderId },
                    {
                        status: 'Processing',
                        paymentDetails: {
                            razorpay_order_id,
                            razorpay_payment_id,
                            razorpay_signature
                        }
                    },
                    { new: true }
                );
                console.log(`Order ${orderId} updated to Processing after Razorpay verification`);
            }

            return res.status(200).json({
                success: true,
                message: "Payment verified successfully"
            });
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid signature sent!"
            });
        }
    } catch (error) {
        console.error('Razorpay Verification Error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message
        });
    }
};

