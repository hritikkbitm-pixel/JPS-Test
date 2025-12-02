const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // Keeping original string ID for compatibility
    name: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    category: { type: String, required: true },
    brand: { type: String, required: true },
    image: { type: String }, // Base64 or URL
    images: [{ type: String }], // Array of Base64 or URLs
    specs: { type: Map, of: mongoose.Schema.Types.Mixed }, // Flexible specs object
    sold: { type: Number, default: 0 },
    available: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
