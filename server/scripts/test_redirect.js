const axios = require('axios');

async function test() {
    try {
        // Test a likely invalid page
        const url = 'https://mdcomputers.in/memory?page=1000';
        console.log(`Requesting: ${url}`);
        const res = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        // In Node.js axios, the final URL is often in res.request.res.responseUrl
        const finalUrl = res.request.res.responseUrl;
        console.log(`Final URL: ${finalUrl}`);

        if (finalUrl !== url) {
            console.log('Redirect detected!');
        } else {
            console.log('No redirect detected (or URLs match).');
        }

    } catch (e) {
        console.error(`Error: ${e.message}`);
    }
}

test();
