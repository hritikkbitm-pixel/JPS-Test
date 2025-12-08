const https = require("https");
const PaytmChecksum = require("paytmchecksum");

exports.createPaytmOrder = async (req, res) => {
    const { amount, email, mobile } = req.body;

    const orderId = "ORD" + Date.now();
    const PAYTM_MID = process.env.PAYTM_MID || 'TESTMID123';
    const PAYTM_MERCHANT_KEY = process.env.PAYTM_MERCHANT_KEY || 'TestMerchantKey';

    const paytmParams = {
        body: {
            requestType: "Payment",
            mid: PAYTM_MID,
            websiteName: "WEBSTAGING", // Change to "DEFAULT" for Production
            orderId: orderId,
            callbackUrl: `http://localhost:5001/api/payment/paytm/status/${orderId}`,
            txnAmount: {
                value: String(amount),
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

        const postData = JSON.stringify(paytmParams);

        const options = {
            hostname: "securegw-stage.paytm.in", // Use securegw.paytm.in for Prod
            path: `/theia/api/v1/initiateTransaction?mid=${PAYTM_MID}&orderId=${orderId}`,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": postData.length,
            }
        };

        const reqPaytm = https.request(options, (resp) => {
            let response = "";
            resp.on("data", (chunk) => {
                response += chunk;
            });
            resp.on("end", () => {
                try {
                    const json = JSON.parse(response);
                    return res.json({
                        success: true,
                        orderId,
                        txnToken: json.body.txnToken,
                        mid: PAYTM_MID,
                        amount: String(amount)
                    });
                } catch (e) {
                    return res.status(500).json({ error: "Invalid response from Paytm" });
                }
            });
        });

        reqPaytm.write(postData);
        reqPaytm.end();
    } catch (error) {
        console.error("Paytm Init Error:", error);
        res.status(500).json({ error: "Paytm initialization failed" });
    }
};

exports.verifyPaytmStatus = async (req, res) => {
    // This is a placeholder as actual verification usually happens via POST callback
    // But for this flow, we might just check status
    const { orderId } = req.params;
    // Implementation would involve Payment Status API call
    res.json({ status: "Pending Implementation", orderId });
};

// Handle POST Callback from Paytm
exports.paytmCallback = (req, res) => {
    // Paytm sends form data here
    console.log("Paytm Callback:", req.body);
    // redirects user to frontend success
    res.redirect(`http://localhost:3000/payment/success?orderId=${req.body.ORDERID}&status=${req.body.STATUS}`);
};
