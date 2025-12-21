const express = require('express');
const router = express.Router();
const OfferTile = require('../models/OfferTile');
const Season = require('../models/Season');
const Campaign = require('../models/Campaign');

// GET tiles for a season
router.get('/', async (req, res) => {
    try {
        const { season_id } = req.query;
        const query = season_id ? { season_id } : {};
        const tiles = await OfferTile.find(query).sort({ position: 1 });
        res.json(tiles);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create tile (admin)
router.post('/', async (req, res) => {
    try {
        const { season_id, title, subtitle, image_url, campaign_id, position, is_active } = req.body;

        // Validate season exists
        const season = await Season.findOne({ id: season_id });
        if (!season) {
            return res.status(400).json({ error: 'Invalid season_id' });
        }

        // Validate campaign exists
        const campaign = await Campaign.findOne({ id: campaign_id });
        if (!campaign) {
            return res.status(400).json({ error: 'Invalid campaign_id' });
        }

        const id = 'tile-' + Date.now();
        const tile = new OfferTile({ id, season_id, title, subtitle, image_url, campaign_id, position, is_active });
        await tile.save();
        res.status(201).json(tile);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT update tile (admin)
router.put('/:id', async (req, res) => {
    try {
        const { title, subtitle, image_url, campaign_id, position, is_active } = req.body;

        // Validate campaign if provided
        if (campaign_id) {
            const campaign = await Campaign.findOne({ id: campaign_id });
            if (!campaign) {
                return res.status(400).json({ error: 'Invalid campaign_id' });
            }
        }

        const tile = await OfferTile.findOneAndUpdate(
            { id: req.params.id },
            { title, subtitle, image_url, campaign_id, position, is_active },
            { new: true }
        );
        if (!tile) {
            return res.status(404).json({ error: 'Tile not found' });
        }
        res.json(tile);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT reorder tiles (admin)
router.put('/reorder', async (req, res) => {
    try {
        const { tiles } = req.body; // Array of { id, position }

        for (const t of tiles) {
            await OfferTile.findOneAndUpdate({ id: t.id }, { position: t.position });
        }

        res.json({ message: 'Tiles reordered' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE tile (admin)
router.delete('/:id', async (req, res) => {
    try {
        const tile = await OfferTile.findOneAndDelete({ id: req.params.id });
        if (!tile) {
            return res.status(404).json({ error: 'Tile not found' });
        }
        res.json({ message: 'Tile deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
