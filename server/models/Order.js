const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    email: { type: String }, // User email for linking
    date: { type: String }, // Keeping as string to match existing format, or could migrate to Date
    items: [{
        id: String,
        name: String,
        category: String,
        price: Number,
        brand: String,
        image: String,
        specs: mongoose.Schema.Types.Mixed,
        stock: Number,
        sold: Number,
        available: Boolean,
        unavailable: Boolean
    }],
    total: { type: Number, required: true },
    status: { type: String, default: 'Pending' },
    shippingAddress: {
        label: String,
        line1: String,
        line2: String,
        city: String,
        zip: String,
        state: String,
        phone: String
    },
    messages: [{
        text: String,
        date: String,
        sender: String
    }],
    invoice: { type: String } // Base64 PDF
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
