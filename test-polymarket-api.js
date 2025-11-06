const fetch = require('node-fetch');

async function testPolymarketAPI() {
    console.log('Testing Polymarket API with different market IDs...\n');

    // Test with different formats of market IDs
    const marketIds = [
        // Test with current market from Polymarket homepage
        '0x3a5c6e25fc3ac13b3ba9a3efea8e3e84a27c0b9d',
        // A known working market
        '21742633143463906290569050155826241533067272736897614950488156847949938836455',
        // Alternative format
        'harris-president'
    ];

    for (const marketId of marketIds) {
        try {
            console.log(`--- Testing Market ID: ${marketId} ---`);

            const response = await fetch(`https://gamma-api.polymarket.com/markets/${marketId}`, {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'poly402-agent-tracker/1.0'
                }
            });

            console.log(`Response status: ${response.status}`);

            if (response.ok) {
                const data = await response.json();
                console.log('✅ SUCCESS! Market data received:');
                console.log(`Question: ${data.question || 'N/A'}`);
                console.log(`Active: ${data.active || 'N/A'}`);
                console.log(`Tokens: ${data.tokens ? data.tokens.length : 'N/A'}`);

                // Check for tokens specifically
                if (data.tokens && Array.isArray(data.tokens)) {
                    console.log('\n=== Token Prices ===');
                    data.tokens.forEach(token => {
                        console.log(`${token.outcome}: $${token.price}`);
                    });
                } else {
                    console.log('No tokens array found');
                }

                console.log('\n=== Full Response ===');
                console.log(JSON.stringify(data, null, 2));
                break; // Stop on first success

            } else {
                const errorText = await response.text();
                console.log(`❌ Failed: ${response.status} - ${errorText}`);
            }

        } catch (error) {
            console.error(`❌ Error testing ${marketId}:`, error.message);
        }

        console.log('\n' + '='.repeat(50) + '\n');
    }
}

// Also test the general markets endpoint
async function testMarketsEndpoint() {
    try {
        console.log('Testing general markets endpoint...');

        const response = await fetch('https://gamma-api.polymarket.com/markets?limit=1&closed=false', {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'poly402-agent-tracker/1.0'
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Markets endpoint works!');

            if (data.data && data.data.length > 0) {
                const market = data.data[0];
                console.log(`Sample market ID: ${market.id}`);
                console.log(`Sample question: ${market.question}`);

                // Now test this specific market
                console.log('\n--- Testing sample market ID ---');
                await testSpecificMarket(market.id);
            }
        } else {
            console.log(`❌ Markets endpoint failed: ${response.status}`);
        }

    } catch (error) {
        console.error('Error testing markets endpoint:', error);
    }
}

async function testSpecificMarket(marketId) {
    try {
        const response = await fetch(`https://gamma-api.polymarket.com/markets/${marketId}`, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'poly402-agent-tracker/1.0'
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Specific market works!');
            console.log(`Question: ${data.question}`);

            if (data.tokens && Array.isArray(data.tokens)) {
                console.log('Token prices:');
                data.tokens.forEach(token => {
                    console.log(`  ${token.outcome}: $${token.price}`);
                });
            }
        } else {
            console.log(`❌ Specific market failed: ${response.status}`);
        }
    } catch (error) {
        console.error('Error testing specific market:', error);
    }
}

// Run tests
testMarketsEndpoint()
    .then(() => testPolymarketAPI())
    .catch(console.error);