const express = require('express');
const router = express.Router();
const Season = require('../models/Season');
const Campaign = require('../models/Campaign');
const OfferTile = require('../models/OfferTile');

// GET all seasons (admin)
router.get('/', async (req, res) => {
    try {
        const seasons = await Season.find().sort({ createdAt: -1 });
        res.json(seasons);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET active season (public)
router.get('/active', async (req, res) => {
    try {
        const now = new Date();
        const season = await Season.findOne({
            is_active: true,
            $or: [
                { start_date: { $lte: now }, end_date: { $gte: now } },
                { start_date: null, end_date: null }
            ]
        });
        res.json(season || null);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET season by slug with offer tiles (public)
router.get('/:slug', async (req, res) => {
    try {
        const season = await Season.findOne({ slug: req.params.slug });
        if (!season) {
            return res.status(404).json({ error: 'Season not found' });
        }
        const tiles = await OfferTile.find({ season_id: season.id, is_active: true }).sort({ position: 1 });

        // Fetch campaign slugs for tiles
        const campaignIds = tiles.map(t => t.campaign_id);
        const campaigns = await Campaign.find({ id: { $in: campaignIds } });
        const campaignMap = campaigns.reduce((acc, c) => { acc[c.id] = c; return acc; }, {});

        const tilesWithCampaigns = tiles.map(t => ({
            ...t.toObject(),
            campaign: campaignMap[t.campaign_id] || null
        }));

        res.json({ season, tiles: tilesWithCampaigns });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create season (admin)
router.post('/', async (req, res) => {
    try {
        const { name, slug, hero_banner_image, subtitle, start_date, end_date, is_active } = req.body;
        const id = 'season-' + slug + '-' + Date.now();

        // If activating this season, deactivate others
        if (is_active) {
            await Season.updateMany({}, { is_active: false });
        }

        const season = new Season({ id, name, slug, hero_banner_image, subtitle, start_date, end_date, is_active });
        await season.save();
        res.status(201).json(season);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT update season (admin)
router.put('/:id', async (req, res) => {
    try {
        const { name, slug, hero_banner_image, subtitle, start_date, end_date, is_active } = req.body;

        // If activating this season, deactivate others
        if (is_active) {
            await Season.updateMany({ id: { $ne: req.params.id } }, { is_active: false });
        }

        const season = await Season.findOneAndUpdate(
            { id: req.params.id },
            { name, slug, hero_banner_image, subtitle, start_date, end_date, is_active },
            { new: true }
        );
        if (!season) {
            return res.status(404).json({ error: 'Season not found' });
        }
        res.json(season);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE season (admin) - with validation
router.delete('/:id', async (req, res) => {
    try {
        // Check if campaigns exist
        const campaignCount = await Campaign.countDocuments({ season_id: req.params.id });
        if (campaignCount > 0) {
            return res.status(400).json({ error: 'Cannot delete season with existing campaigns. Delete campaigns first.' });
        }

        // Check if tiles exist
        const tileCount = await OfferTile.countDocuments({ season_id: req.params.id });
        if (tileCount > 0) {
            return res.status(400).json({ error: 'Cannot delete season with existing offer tiles. Delete tiles first.' });
        }

        const season = await Season.findOneAndDelete({ id: req.params.id });
        if (!season) {
            return res.status(404).json({ error: 'Season not found' });
        }
        res.json({ message: 'Season deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
