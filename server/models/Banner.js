const mongoose = require('mongoose');

const BannerSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String },
    sub: { type: String },
    image: { type: String, required: true },
    target: { type: String },
    type: { type: String, default: 'hero' },
    targetType: { type: String },
    targetValue: { type: String },
    productIds: [{ type: String }],
    description: { type: String },
    backgroundColor: { type: String },
    textColor: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Banner', BannerSchema);
