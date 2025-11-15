const fetch = require('node-fetch');

async function testMarketsEndpoint() {
    try {
        console.log('Testing general markets endpoint...');

        const response = await fetch('https://gamma-api.polymarket.com/markets?limit=3&closed=false', {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Polysentience-agent-tracker/1.0'
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Markets endpoint works!');
            console.log('\n=== Full Response Structure ===');
            console.log(JSON.stringify(data, null, 2));

            if (data.data && data.data.length > 0) {
                console.log('\n=== Sample Market Analysis ===');
                const market = data.data[0];
                console.log(`Market ID: ${market.id}`);
                console.log(`Question: ${market.question}`);
                console.log(`Active: ${market.active}`);
                console.log(`Tokens available: ${market.tokens ? market.tokens.length : 'N/A'}`);

                if (market.tokens && Array.isArray(market.tokens)) {
                    console.log('\n=== Token Prices ===');
                    market.tokens.forEach(token => {
                        console.log(`${token.outcome}: $${token.price} (${token.price * 100}%)`);
                    });
                }
            }
        } else {
            console.log(`❌ Markets endpoint failed: ${response.status}`);
            const errorText = await response.text();
            console.log('Error:', errorText);
        }

    } catch (error) {
        console.error('Error testing markets endpoint:', error);
    }
}

testMarketsEndpoint();