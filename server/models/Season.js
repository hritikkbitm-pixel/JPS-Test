const mongoose = require('mongoose');

const SeasonSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    hero_banner_image: { type: String },
    subtitle: { type: String },
    start_date: { type: Date },
    end_date: { type: Date },
    is_active: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Season', SeasonSchema);
