const axios = require("axios");
const crypto = require("crypto");

const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || 'TESTMERCHANTID'; // Default or from env
const SALT_KEY = process.env.PHONEPE_SALT_KEY || 'test-salt-key';
const SALT_INDEX = process.env.PHONEPE_SALT_INDEX || '1';

exports.createPhonePeOrder = async (req, res) => {
    try {
        const { amount, userId, mobileNumber } = req.body;

        if (!amount) {
            return res.status(400).json({ error: "Amount is required" });
        }

        const merchantTransactionId = "TXN" + Date.now();

        const payload = {
            merchantId: MERCHANT_ID,
            merchantTransactionId,
            amount: Math.round(amount * 100), // convert to paise, ensure integer
            redirectUrl: `http://localhost:3000/payment/success?id=${merchantTransactionId}`, // Frontend Success Page
            callbackUrl: `http://localhost:5001/api/payment/phonepe/status/${merchantTransactionId}`, // Server Callback
            mobileNumber: mobileNumber || "9999999999",
            paymentInstrument: { type: "PAY_PAGE" }
        };

        const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");

        const stringToHash = base64Payload + "/pg/v1/pay" + SALT_KEY;
        const sha256 = crypto.createHash("sha256").update(stringToHash).digest("hex");
        const finalXHeader = sha256 + "###" + SALT_INDEX;

        // Use UAT/Test URL by default. For Prod, user needs to change this.
        const PHONEPE_API_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay";
        // Prod: "https://api.phonepe.com/apis/hermes/pg/v1/pay"

        const response = await axios.post(
            PHONEPE_API_URL,
            { request: base64Payload },
            { headers: { "Content-Type": "application/json", "X-VERIFY": finalXHeader } }
        );

        return res.json({
            success: true,
            redirectUrl: response.data.data.instrumentResponse.redirectInfo.url,
            transactionId: merchantTransactionId
        });

    } catch (error) {
        console.error("PhonePe Error:", error.response?.data || error.message);
        return res.status(500).json({ error: "Payment initialization failed", details: error.response?.data });
    }
};

exports.verifyPhonePePayment = async (req, res) => {
    const { txnId } = req.params;

    try {
        const stringToHash = `/pg/v1/status/${MERCHANT_ID}/${txnId}` + SALT_KEY;
        const sha256 = crypto.createHash("sha256").update(stringToHash).digest("hex");
        const finalXHeader = sha256 + "###" + SALT_INDEX;

        const PHONEPE_STATUS_URL = `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${MERCHANT_ID}/${txnId}`;
        // Prod: `https://api.phonepe.com/apis/hermes/pg/v1/status/${MERCHANT_ID}/${txnId}`

        const resp = await axios.get(PHONEPE_STATUS_URL, {
            headers: { "X-VERIFY": finalXHeader, "X-MERCHANT-ID": MERCHANT_ID }
        });

        if (resp.data.code === 'PAYMENT_SUCCESS') {
            // TODO: Update order status in DB
            console.log(`Payment Success for TXN ${txnId}`);
        } else {
            console.log(`Payment Failed/Pending for TXN ${txnId}: ${resp.data.code}`);
        }

        res.json(resp.data);
    } catch (error) {
        console.error("PhonePe Status Error:", error.message);
        res.status(500).json({ error: "Failed to verify payment" });
    }
};
