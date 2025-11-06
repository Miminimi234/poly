/**
 * Detailed test to examine Polymarket price data structure
 */
import { fetchPolymarketMarkets } from './src/lib/polymarket-client';

async function testPolymarketPrices() {
    console.log('🔍 Detailed Polymarket Price Analysis...\n');

    try {
        // Fetch more markets to find ones with good price data
        const markets = await fetchPolymarketMarkets(10);

        console.log(`📊 Analyzing ${markets.length} markets for price data:\n`);

        markets.forEach((market, index) => {
            console.log(`Market ${index + 1}: ${market.question.slice(0, 50)}...`);
            console.log(`   ID: ${market.id}`);
            console.log(`   Volume: $${parseFloat(market.volume || '0').toLocaleString()}`);
            console.log(`   Active: ${market.active}, Closed: ${market.closed}`);

            // Examine price data structure
            console.log(`   Outcomes: ${JSON.stringify(market.outcomes)}`);
            console.log(`   Outcome Prices: ${JSON.stringify(market.outcomePrices)}`);

            if (market.outcomePrices && market.outcomePrices.length >= 2) {
                const yesPrice = parseFloat(market.outcomePrices[0]);
                const noPrice = parseFloat(market.outcomePrices[1]);

                if (!isNaN(yesPrice) && !isNaN(noPrice)) {
                    console.log(`   ✅ YES: ${(yesPrice * 100).toFixed(1)}%, NO: ${(noPrice * 100).toFixed(1)}%`);
                } else {
                    console.log(`   ❌ Invalid prices - YES: ${market.outcomePrices[0]}, NO: ${market.outcomePrices[1]}`);
                }
            } else {
                console.log(`   ❌ No price data available`);
            }

            console.log('');
        });

        // Find markets with valid price data
        const validMarkets = markets.filter(market => {
            if (!market.outcomePrices || market.outcomePrices.length < 2) return false;
            const yesPrice = parseFloat(market.outcomePrices[0]);
            const noPrice = parseFloat(market.outcomePrices[1]);
            return !isNaN(yesPrice) && !isNaN(noPrice);
        });

        console.log(`\n📈 Summary:`);
        console.log(`   Total markets: ${markets.length}`);
        console.log(`   Markets with valid prices: ${validMarkets.length}`);
        console.log(`   Markets with volume > $1000: ${markets.filter(m => parseFloat(m.volume || '0') > 1000).length}`);

        if (validMarkets.length > 0) {
            console.log(`\n🎯 Best market for testing:`);
            const bestMarket = validMarkets.sort((a, b) => parseFloat(b.volume || '0') - parseFloat(a.volume || '0'))[0];
            console.log(`   Question: ${bestMarket.question}`);
            console.log(`   Volume: $${parseFloat(bestMarket.volume || '0').toLocaleString()}`);
            console.log(`   YES: ${(parseFloat(bestMarket.outcomePrices[0]) * 100).toFixed(1)}%`);
            console.log(`   NO: ${(parseFloat(bestMarket.outcomePrices[1]) * 100).toFixed(1)}%`);
        }

    } catch (error: any) {
        console.error('❌ Test failed:', error.message);
    }
}

testPolymarketPrices();