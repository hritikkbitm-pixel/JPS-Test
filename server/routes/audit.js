const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');

// Middleware for Admin Auth (Duplicated from products.js - ideally should be in a shared file)
const checkAuth = (req, res, next) => {
    const userEmail = req.headers['x-user-email'];
    const admins = ['hritik@jps.com', 'admin@jps.com'];

    if (!userEmail || !admins.includes(userEmail)) {
        return res.status(403).json({ message: 'Unauthorized' });
    }
    next();
};

// Get recent logs
router.get('/', checkAuth, async (req, res) => {
    try {
        const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(50);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
