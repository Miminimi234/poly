// Test the complete market odds tracker flow
const fetch = require('node-fetch');

// Simulate the fixed parsing logic
async function testMarketOddsFlow() {
    console.log('🔄 Testing complete market odds tracker flow...\n');

    // Step 1: Simulate getting market IDs from Firebase agent predictions
    // In reality, this would come from Firebase, but for testing we'll use known market IDs
    const simulatedMarketIds = [
        '516710', // US recession market
        '516706'  // Fed rate hike market
    ];

    console.log(`📊 Step 1: Found ${simulatedMarketIds.length} markets with predictions:`, simulatedMarketIds);

    // Step 2: Update odds for each market
    for (const marketId of simulatedMarketIds) {
        try {
            console.log(`\n--- Processing Market ${marketId} ---`);

            // Fetch from Polymarket API
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
            console.log(`✅ Market data fetched: ${data.question}`);

            // Apply fixed parsing logic
            let yesPrice = 0.5; // Default fallback
            let noPrice = 0.5;

            if (data.outcomePrices) {
                console.log(`📊 Found outcomePrices:`, data.outcomePrices);

                try {
                    const pricesArray = typeof data.outcomePrices === 'string'
                        ? JSON.parse(data.outcomePrices)
                        : data.outcomePrices;

                    if (Array.isArray(pricesArray) && pricesArray.length >= 2) {
                        yesPrice = parseFloat(pricesArray[0]);
                        noPrice = parseFloat(pricesArray[1]);
                        console.log(`📊 Extracted prices - Yes: ${yesPrice}, No: ${noPrice}`);
                    }
                } catch (parseError) {
                    console.error(`❌ Failed to parse outcomePrices:`, parseError);
                }
            }

            // Create market odds object (this would be stored in Firebase)
            const marketOdds = {
                market_id: marketId,
                question: data.question,
                yes_price: yesPrice,
                no_price: noPrice,
                volume_24h: parseFloat(data.volume24hr || '0'),
                last_updated: new Date().toISOString()
            };

            console.log(`💾 Market odds to store:`, {
                market_id: marketOdds.market_id,
                question: marketOdds.question,
                yes_price: `$${marketOdds.yes_price.toFixed(4)} (${(marketOdds.yes_price * 100).toFixed(1)}%)`,
                no_price: `$${marketOdds.no_price.toFixed(4)} (${(marketOdds.no_price * 100).toFixed(1)}%)`,
                volume_24h: `$${marketOdds.volume_24h.toLocaleString()}`,
                last_updated: marketOdds.last_updated
            });

            // Check if we got real prices (not fallback)
            const success = yesPrice !== 0.5 || noPrice !== 0.5;
            console.log(`Result: ${success ? '🎉 SUCCESS' : '❌ FAILED - using fallback prices'}`);

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));

        } catch (error) {
            console.error(`❌ Failed to update odds for market ${marketId}:`, error.message);
        }
    }

    console.log('\n✅ Market odds tracker flow test complete!');
}

testMarketOddsFlow().catch(console.error);