/**
 * Test updated Polymarket parsing with the fixed client
 */
import { fetchPolymarketMarkets, parsePolymarketMarket } from './src/lib/polymarket-client';

async function testUpdatedPolymarketParsing() {
    console.log('🧪 Testing Updated Polymarket Parsing...\n');

    try {
        // Fetch markets
        const markets = await fetchPolymarketMarkets(10);
        console.log(`✅ Fetched ${markets.length} markets\n`);

        // Test parsing each market
        const parsedMarkets = markets.map(market => {
            try {
                const parsed = parsePolymarketMarket(market);
                return { original: market, parsed, success: true };
            } catch (error) {
                return { original: market, error: error.message, success: false };
            }
        });

        console.log('📊 Parsing Results:\n');

        parsedMarkets.forEach((result, index) => {
            if (result.success) {
                const { parsed } = result;
                console.log(`✅ Market ${index + 1}: ${parsed.question.slice(0, 50)}...`);
                console.log(`   Volume: $${parsed.volume.toLocaleString()}`);
                console.log(`   YES Price: ${(parsed.yes_price * 100).toFixed(1)}%`);
                console.log(`   NO Price: ${(parsed.no_price * 100).toFixed(1)}%`);
                console.log(`   Active: ${parsed.active}, Resolved: ${parsed.resolved}`);
            } else {
                console.log(`❌ Market ${index + 1}: Parse failed - ${result.error}`);
            }
            console.log('');
        });

        // Summary
        const successCount = parsedMarkets.filter(r => r.success).length;
        const validPriceCount = parsedMarkets.filter(r =>
            r.success && r.parsed.yes_price !== 0.5 && r.parsed.no_price !== 0.5
        ).length;

        console.log('📈 Summary:');
        console.log(`   Successfully parsed: ${successCount}/${markets.length}`);
        console.log(`   Markets with real prices: ${validPriceCount}/${markets.length}`);
        console.log(`   Markets with volume > $1000: ${parsedMarkets.filter(r => r.success && r.parsed.volume > 1000).length}`);

        // Show best markets for AI analysis
        const goodMarkets = parsedMarkets
            .filter(r => r.success && r.parsed.volume > 1000 && r.parsed.active && !r.parsed.resolved)
            .sort((a, b) => b.parsed.volume - a.parsed.volume)
            .slice(0, 3);

        if (goodMarkets.length > 0) {
            console.log('\n🎯 Best markets for AI analysis:');
            goodMarkets.forEach((result, index) => {
                const { parsed } = result;
                console.log(`   ${index + 1}. ${parsed.question}`);
                console.log(`      Volume: $${parsed.volume.toLocaleString()}`);
                console.log(`      Current odds: YES ${(parsed.yes_price * 100).toFixed(1)}% / NO ${(parsed.no_price * 100).toFixed(1)}%`);
            });
        }

    } catch (error: any) {
        console.error('❌ Test failed:', error.message);
    }
}

testUpdatedPolymarketParsing();