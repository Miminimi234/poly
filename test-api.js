const fetch = require('node-fetch');

async function testPolymarketAPI() {
    const marketId = '0xdd22472e552920b8438158ea7238bfadfa4f736aa4cee91a6b86c39abe68ea78';

    try {
        console.log('Testing Polymarket API...');
        console.log(`Market ID: ${marketId}`);

        const response = await fetch(`https://gamma-api.polymarket.com/markets/${marketId}`, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'poly402-agent-tracker/1.0'
            }
        });

        console.log(`Response status: ${response.status}`);
        console.log(`Response headers:`, response.headers.raw());

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('=== Polymarket API Response ===');
        console.log(JSON.stringify(data, null, 2));

        // Check for tokens specifically
        if (data.tokens) {
            console.log('\n=== Tokens Array ===');
            console.log(JSON.stringify(data.tokens, null, 2));
        }

    } catch (error) {
        console.error('Error testing API:', error);
    }
}

testPolymarketAPI();