const express = require('express');
const router = express.Router();
const Banner = require('../models/Banner');

// Get all banners
router.get('/', async (req, res) => {
    try {
        const banners = await Banner.find();
        res.json(banners);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create banner
router.post('/', async (req, res) => {
    const banner = new Banner(req.body);
    try {
        const newBanner = await banner.save();
        res.status(201).json(newBanner);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update banner
router.put('/:id', async (req, res) => {
    try {
        const updatedBanner = await Banner.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
        res.json(updatedBanner);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete banner
router.delete('/:id', async (req, res) => {
    try {
        await Banner.findOneAndDelete({ id: req.params.id });
        res.json({ message: 'Banner deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
