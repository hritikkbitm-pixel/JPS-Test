const mongoose = require('mongoose');

const CampaignSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    season_id: { type: String, required: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    filters: { type: mongoose.Schema.Types.Mixed, default: {} },
    is_active: { type: Boolean, default: true },
    priority: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Campaign', CampaignSchema);
