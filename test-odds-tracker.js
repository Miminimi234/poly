const fetch = require('node-fetch');

// Test the market odds tracker logic with real Polymarket data
async function testMarketOddsTracker() {
    const marketId = '516710'; // US recession market from our test

    try {
        console.log(`Testing market odds tracker for market ${marketId}...`);

        const response = await fetch(`https://gamma-api.polymarket.com/markets/${marketId}`, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Polysentience-agent-tracker/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ Market data received for: ${data.question}`);

        // Apply the same logic as the fixed market-odds-tracker
        let yesPrice = 0.5; // Default fallback
        let noPrice = 0.5;

        // Check for outcomePrices first (current Polymarket API format)
        if (data.outcomePrices && Array.isArray(data.outcomePrices)) {
            console.log(`📊 Market ${marketId}: Found outcomePrices:`, data.outcomePrices);

            // outcomePrices is typically ["0.45", "0.55"] where first is Yes, second is No
            if (data.outcomePrices.length >= 2) {
                yesPrice = parseFloat(data.outcomePrices[0]);
                noPrice = parseFloat(data.outcomePrices[1]);
            }
        }
        // Fallback: Check if tokens exist (legacy format)
        else if (data.tokens && Array.isArray(data.tokens)) {
            console.log(`📊 Market ${marketId}: Using legacy tokens format`);
            for (const token of data.tokens) {
                const price = parseFloat(token.price);

                if (token.outcome.toLowerCase() === 'yes') {
                    yesPrice = price;
                } else if (token.outcome.toLowerCase() === 'no') {
                    noPrice = price;
                }
            }
        }
        // Fallback: Check for direct price fields
        else if (data.yes_price !== undefined || data.no_price !== undefined) {
            console.log(`📊 Market ${marketId}: Using direct price fields`);
            if (data.yes_price !== undefined) {
                yesPrice = parseFloat(data.yes_price);
            }
            if (data.no_price !== undefined) {
                noPrice = parseFloat(data.no_price);
            }
        }
        else {
            console.log(`⚠️ Market ${marketId}: No price data found in response, using fallback 0.5/0.5`);
            console.log(`Available fields:`, Object.keys(data || {}));
        }

        // Ensure prices add up to ~1.0 (accounting for fees)
        const totalPrice = yesPrice + noPrice;
        if (totalPrice > 0) {
            yesPrice = yesPrice / totalPrice;
            noPrice = noPrice / totalPrice;
        }

        console.log('\n=== FINAL RESULTS ===');
        console.log(`Question: ${data.question}`);
        console.log(`Yes Price: $${yesPrice.toFixed(4)} (${(yesPrice * 100).toFixed(1)}%)`);
        console.log(`No Price: $${noPrice.toFixed(4)} (${(noPrice * 100).toFixed(1)}%)`);
        console.log(`Total: ${totalPrice.toFixed(4)}`);

        if (yesPrice !== 0.5 || noPrice !== 0.5) {
            console.log('🎉 SUCCESS! Real prices extracted from Polymarket API');
        } else {
            console.log('❌ FAILED: Still using fallback prices');
        }

    } catch (error) {
        console.error('Error testing market odds tracker:', error);
    }
}

testMarketOddsTracker();