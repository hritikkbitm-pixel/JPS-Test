const axios = require("axios");
const PaytmChecksum = require("paytmchecksum");
const Order = require("../models/Order");

exports.createPaytmOrder = async (req, res) => {
    const { amount, email, mobile, orderId: frontendOrderId } = req.body;

    const orderId = frontendOrderId || "ORD" + Date.now();
    const PAYTM_MID = process.env.PAYTM_MID;
    const PAYTM_MERCHANT_KEY = process.env.PAYTM_MERCHANT_KEY;
    const PAYTM_WEBSITE = process.env.PAYTM_WEBSITE || "WEBSTAGING";
    const PAYTM_INDUSTRY_TYPE = process.env.PAYTM_INDUSTRY_TYPE || "Retail";
    const PAYTM_CHANNEL_ID = process.env.PAYTM_CHANNEL_ID_WEB || "WEB";

    const BACKEND_URL = process.env.API_URL || "http://localhost:5001";

    const paytmParams = {
        body: {
            requestType: "Payment",
            mid: PAYTM_MID,
            websiteName: PAYTM_WEBSITE,
            orderId: orderId,
            callbackUrl: `${BACKEND_URL}/api/payment/paytm/callback`,
            txnAmount: {
                value: String(parseFloat(amount).toFixed(2)),
                currency: "INR"
            },
            userInfo: {
                custId: "CUST_" + Date.now(),
                email: email || "customer@example.com",
                mobile: mobile || "9999999999"
            }
        }
    };

    try {
        const checksum = await PaytmChecksum.generateSignature(
            JSON.stringify(paytmParams.body),
            PAYTM_MERCHANT_KEY
        );

        paytmParams.head = { signature: checksum };

        console.log("--- INITIATING PAYTM TRANSACTION ---");
        console.log("MID used:", PAYTM_MID);
        console.log("Website used:", PAYTM_WEBSITE);
        console.log("Order ID:", orderId);
        console.log("Payload Body:", JSON.stringify(paytmParams.body, null, 2));

        const response = await axios.post(
            `https://securegw-stage.paytm.in/theia/api/v1/initiateTransaction?mid=${PAYTM_MID}&orderId=${orderId}`,
            paytmParams,
            {
                headers: { "Content-Type": "application/json" }
            }
        );

        const json = response.data;
        console.log("Paytm Init Response JSON:", JSON.stringify(json, null, 2));

        if (json.body && json.body.resultInfo && json.body.resultInfo.resultStatus === "S") {
            return res.json({
                success: true,
                orderId,
                txnToken: json.body.txnToken,
                mid: PAYTM_MID,
                amount: String(amount)
            });
        } else {
            console.error("🔥 PAYTM BUSINESS ERROR:", json.body?.resultInfo);
            return res.status(400).json({
                success: false,
                error: json.body?.resultInfo?.resultMsg || "Invalid response from Paytm",
                raw: json
            });
        }
    } catch (err) {
        console.error("🔥 PAYTM INIT ERROR FULL OBJECT:", err);
        console.error("🔥 PAYTM RESPONSE DATA:", err.response?.data);
        console.error("🔥 PAYTM RESPONSE STATUS:", err.response?.status);
        console.error("🔥 PAYTM RESPONSE HEADERS:", err.response?.headers);

        return res.status(err.response?.status || 500).json({
            success: false,
            error: "Paytm initialization failed",
            paytmError: err.response?.data || err.message
        });
    }
};

exports.verifyPaytmStatus = async (req, res) => {
    const { orderId } = req.params;
    const PAYTM_MID = process.env.PAYTM_MID;
    const PAYTM_MERCHANT_KEY = process.env.PAYTM_MERCHANT_KEY;

    const paytmParams = {
        body: {
            mid: PAYTM_MID,
            orderId: orderId,
        }
    };

    try {
        const checksum = await PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), PAYTM_MERCHANT_KEY);
        paytmParams.head = { signature: checksum };

        const response = await axios.post(
            "https://securegw-stage.paytm.in/v3/order/status",
            paytmParams,
            {
                headers: { "Content-Type": "application/json" }
            }
        );

        res.json(response.data);
    } catch (e) {
        console.error("Status check failed:", e.response?.data || e.message);
        res.status(500).json({ error: "Status check failed" });
    }
};

exports.paytmCallback = async (req, res) => {
    console.log("Paytm Callback received:", req.body);
    const { ORDERID, STATUS, RESPCODE, RESPMSG } = req.body;
    const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

    try {
        if (STATUS === "TXN_SUCCESS") {
            await Order.findOneAndUpdate({ id: ORDERID }, { status: "Paid" });
            res.redirect(`${FRONTEND_URL}/payment/success?orderId=${ORDERID}`);
        } else {
            await Order.findOneAndUpdate({ id: ORDERID }, { status: "Payment Failed" });
            res.redirect(`${FRONTEND_URL}/payment/failure?orderId=${ORDERID}&msg=${encodeURIComponent(RESPMSG)}`);
        }
    } catch (err) {
        console.error("Order Update Error in Callback:", err);
        res.redirect(`${FRONTEND_URL}/payment/failure?orderId=${ORDERID}&msg=Error+updating+order+status`);
    }
};
