const mongoose = require('mongoose');
const crypto = require('crypto');

const QuotationItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1 },
    category: { type: String, default: '' },
    brand: { type: String, default: '' },
    image: { type: String, default: '' },
    productId: { type: String, default: '' }, // Reference to catalog product (empty for custom)
    isCustom: { type: Boolean, default: false }
}, { _id: false });

const QuotationSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true,
        default: () => crypto.randomUUID()
    },
    items: [QuotationItemSchema],
    customerName: { type: String, default: '' },
    customerEmail: { type: String, default: '' },
    customerPhone: { type: String, default: '' },
    notes: { type: String, default: '' },
    total: { type: Number, required: true },
    status: {
        type: String,
        enum: ['draft', 'sent', 'paid', 'expired', 'cancelled'],
        default: 'sent'
    },
    expiresAt: { type: Date },
    paymentDetails: { type: mongoose.Schema.Types.Mixed },
    createdBy: { type: String, default: '' } // Admin email
}, { timestamps: true });

// Auto-expire check
QuotationSchema.methods.isExpired = function () {
    if (this.expiresAt && new Date() > this.expiresAt) return true;
    return false;
};

module.exports = mongoose.model('Quotation', QuotationSchema);
