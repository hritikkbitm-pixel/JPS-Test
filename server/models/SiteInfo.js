const mongoose = require('mongoose');

const SiteInfoSchema = new mongoose.Schema({
    // Banner settings
    bannerEnabled: { type: Boolean, default: true },
    bannerText: { type: String, default: '' },

    // Popup settings
    popupEnabled: { type: Boolean, default: true },
    popupTitle: { type: String, default: '' },
    popupContent: { type: String, default: '' },

    // Meta
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Ensure only one document exists (singleton pattern)
SiteInfoSchema.statics.getSiteInfo = async function () {
    let info = await this.findOne();
    if (!info) {
        info = await this.create({
            bannerEnabled: true,
            bannerText: '⚠️ Prices of RAM, GPU & Storage may change post-order due to market volatility. Any price increase will require payment of the difference before processing.',
            popupEnabled: true,
            popupTitle: '⚠️ Important Pricing Disclaimer',
            popupContent: 'Due to frequent fluctuations in the global components market, prices of RAM, GPU, and Storage devices may vary after order placement.\n\nIf there is a price increase at the time of order verification, the revised difference must be paid to proceed with processing. Orders will be confirmed only after final price approval.\n\nOur commitment remains to provide the latest market prices with complete transparency.'
        });
    }
    return info;
};

module.exports = mongoose.model('SiteInfo', SiteInfoSchema);
