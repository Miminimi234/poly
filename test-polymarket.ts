/**
 * Test script to check if Polymarket API is working
 */
import { fetchPolymarketMarkets, parsePolymarketMarket } from './src/lib/polymarket-client';

async function testPolymarketAPI() {
    console.log('🧪 Testing Polymarket API...\n');

    try {
        // Test fetching markets
        console.log('📡 Fetching markets from Polymarket...');
        const markets = await fetchPolymarketMarkets(5); // Get just 5 markets for testing

        console.log(`✅ Successfully fetched ${markets.length} markets\n`);

        // Display first few markets
        markets.slice(0, 3).forEach((market, index) => {
            console.log(`📊 Market ${index + 1}:`);
            console.log(`   Question: ${market.question}`);
            console.log(`   ID: ${market.id}`);
            console.log(`   Active: ${market.active}`);
            console.log(`   Closed: ${market.closed}`);
            console.log(`   Volume: $${parseFloat(String(market.volume || 0)).toLocaleString()}`);
            console.log(`   End Date: ${market.endDate}`);

            if (market.outcomePrices && market.outcomePrices.length >= 2) {
                console.log(`   YES Price: ${(parseFloat(market.outcomePrices[0]) * 100).toFixed(1)}%`);
                console.log(`   NO Price: ${(parseFloat(market.outcomePrices[1]) * 100).toFixed(1)}%`);
            }

            console.log('');
        });

        // Test parsing a market
        if (markets.length > 0) {
            console.log('🔧 Testing market parsing...');
            const parsedMarket = parsePolymarketMarket(markets[0]);
            console.log('✅ Market parsed successfully:');
            console.log(`   Polymarket ID: ${parsedMarket.polymarket_id}`);
            console.log(`   Question: ${parsedMarket.question}`);
            console.log(`   YES Price: ${(parsedMarket.yes_price * 100).toFixed(1)}%`);
            console.log(`   NO Price: ${(parsedMarket.no_price * 100).toFixed(1)}%`);
            console.log(`   Volume: $${parsedMarket.volume.toLocaleString()}`);
            console.log(`   End Date: ${parsedMarket.end_date}`);
        }

        console.log('\n🎉 Polymarket API test completed successfully!');

    } catch (error: any) {
        console.error('❌ Polymarket API test failed:');
        console.error(`   Error: ${error.message}`);
        console.error(`   Stack: ${error.stack}`);
    }
}

// Run the test
testPolymarketAPI();