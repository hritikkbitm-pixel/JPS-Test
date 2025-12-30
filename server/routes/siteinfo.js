const express = require('express');
const router = express.Router();
const SiteInfo = require('../models/SiteInfo');

// Get site info (public)
router.get('/', async (req, res) => {
    try {
        const info = await SiteInfo.getSiteInfo();
        res.json(info);
    } catch (err) {
        console.error('Get SiteInfo Error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Update site info (admin only)
router.put('/', async (req, res) => {
    try {
        const { bannerEnabled, bannerText, popupEnabled, popupTitle, popupContent } = req.body;

        let info = await SiteInfo.findOne();
        if (!info) {
            info = new SiteInfo();
        }

        if (bannerEnabled !== undefined) info.bannerEnabled = bannerEnabled;
        if (bannerText !== undefined) info.bannerText = bannerText;
        if (popupEnabled !== undefined) info.popupEnabled = popupEnabled;
        if (popupTitle !== undefined) info.popupTitle = popupTitle;
        if (popupContent !== undefined) info.popupContent = popupContent;

        info.updatedAt = new Date();
        await info.save();

        res.json(info);
    } catch (err) {
        console.error('Update SiteInfo Error:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
