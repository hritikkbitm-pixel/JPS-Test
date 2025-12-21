const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');
const Season = require('../models/Season');
const OfferTile = require('../models/OfferTile');
const Product = require('../models/Product');

// GET all campaigns (admin)
router.get('/', async (req, res) => {
    try {
        const campaigns = await Campaign.find().sort({ priority: -1, createdAt: -1 });
        res.json(campaigns);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET campaign by slug with validation (public)
router.get('/:slug', async (req, res) => {
    try {
        const campaign = await Campaign.findOne({ slug: req.params.slug });
        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        // Validate parent season is active
        const season = await Season.findOne({ id: campaign.season_id });
        if (!season || !season.is_active) {
            return res.status(404).json({ error: 'Campaign not available (season inactive)' });
        }

        res.json({ campaign, season });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET filtered products for a campaign (public)
router.get('/:slug/products', async (req, res) => {
    try {
        const campaign = await Campaign.findOne({ slug: req.params.slug });
        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        // Build query from campaign filters
        const filters = campaign.filters || {};
        const query = { available: true };

        if (filters.category) {
            query.category = filters.category;
        }
        if (filters.brand) {
            query.brand = filters.brand;
        }
        if (filters.minDiscount) {
            // Products where (mrp - price) / mrp >= minDiscount/100
            query.$expr = {
                $gte: [
                    { $divide: [{ $subtract: ['$mrp', '$price'] }, '$mrp'] },
                    filters.minDiscount / 100
                ]
            };
        }
        if (filters.maxPrice) {
            query.price = { ...(query.price || {}), $lte: filters.maxPrice };
        }
        if (filters.minPrice) {
            query.price = { ...(query.price || {}), $gte: filters.minPrice };
        }

        const products = await Product.find(query).sort({ sold: -1 });
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create campaign (admin)
router.post('/', async (req, res) => {
    try {
        const { season_id, name, slug, filters, is_active, priority } = req.body;

        // Validate season exists
        const season = await Season.findOne({ id: season_id });
        if (!season) {
            return res.status(400).json({ error: 'Invalid season_id' });
        }

        const id = 'campaign-' + slug + '-' + Date.now();
        const campaign = new Campaign({ id, season_id, name, slug, filters, is_active, priority });
        await campaign.save();
        res.status(201).json(campaign);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT update campaign (admin)
router.put('/:id', async (req, res) => {
    try {
        const { name, slug, filters, is_active, priority } = req.body;
        const campaign = await Campaign.findOneAndUpdate(
            { id: req.params.id },
            { name, slug, filters, is_active, priority },
            { new: true }
        );
        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }
        res.json(campaign);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE campaign (admin) - with validation
router.delete('/:id', async (req, res) => {
    try {
        // Check if tiles reference this campaign
        const tileCount = await OfferTile.countDocuments({ campaign_id: req.params.id });
        if (tileCount > 0) {
            return res.status(400).json({ error: 'Cannot delete campaign with existing offer tiles. Delete or reassign tiles first.' });
        }

        const campaign = await Campaign.findOneAndDelete({ id: req.params.id });
        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }
        res.json({ message: 'Campaign deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST preview product count for filters (admin helper)
router.post('/preview', async (req, res) => {
    try {
        const { filters } = req.body;
        const query = { available: true };

        if (filters.category) query.category = filters.category;
        if (filters.brand) query.brand = filters.brand;
        if (filters.minDiscount) {
            query.$expr = {
                $gte: [
                    { $divide: [{ $subtract: ['$mrp', '$price'] }, '$mrp'] },
                    filters.minDiscount / 100
                ]
            };
        }

        const count = await Product.countDocuments(query);
        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
