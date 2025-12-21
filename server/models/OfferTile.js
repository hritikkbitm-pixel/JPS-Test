const mongoose = require('mongoose');

const OfferTileSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    season_id: { type: String, required: true, index: true },
    title: { type: String, required: true },
    subtitle: { type: String },
    image_url: { type: String },
    campaign_id: { type: String, required: true },
    position: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('OfferTile', OfferTileSchema);
