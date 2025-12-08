const express = require('express');
const router = express.Router();
const { createPhonePeOrder, verifyPhonePePayment } = require('../controllers/phonepeController');
const { createPaytmOrder, verifyPaytmStatus, paytmCallback } = require('../controllers/paytmController');

// PhonePe Routes
router.post('/phonepe/pay', createPhonePeOrder);
router.get('/phonepe/status/:txnId', verifyPhonePePayment);

// Paytm Routes
router.post('/paytm/pay', createPaytmOrder);
router.get('/paytm/status/:orderId', verifyPaytmStatus);
router.post('/paytm/callback', paytmCallback); // Route for Paytm to post back

module.exports = router;
