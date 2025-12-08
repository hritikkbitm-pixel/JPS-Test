const axios = require('axios');
const cheerio = require('cheerio');

async function debug() {
    try {
        // Test Page 2
        const url2 = 'https://mdcomputers.in/processor?page=2';
        console.log(`Requesting: ${url2}`);
        const res2 = await axios.get(url2, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        console.log(`Page 2 Final URL: ${res2.request.res.responseUrl}`);

        const $2 = cheerio.load(res2.data);
        const nextLink2 = $2('ul.pagination li.active').next().find('a').attr('href');
        console.log(`Page 2 Next Link: ${nextLink2}`);

        // Test Page 3
        const url3 = 'https://mdcomputers.in/processor?page=3';
        console.log(`Requesting: ${url3}`);
        const res3 = await axios.get(url3, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        console.log(`Page 3 Final URL: ${res3.request.res.responseUrl}`);

        const $3 = cheerio.load(res3.data);
        const nextLink3 = $('ul.pagination li.active').next().find('a').attr('href');
        console.log(`Page 3 Next Link: ${nextLink3}`);

    } catch (e) {
        console.error(`Error: ${e.message}`);
    }
}

debug();
