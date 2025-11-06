/**
 * Test raw Polymarket API response structure
 */
async function testRawPolymarketAPI() {
    console.log('🔍 Testing raw Polymarket API response...\n');

    try {
        const response = await fetch('https://gamma-api.polymarket.com/markets?limit=2&offset=0&closed=false', {
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();

        console.log('📊 Raw API Response Structure:');
        console.log('='.repeat(50));

        if (data.length > 0) {
            const firstMarket = data[0];
            console.log('First Market Data:');
            console.log(JSON.stringify(firstMarket, null, 2));

            console.log('\n🔍 Detailed Analysis:');
            console.log(`Question: ${firstMarket.question}`);
            console.log(`Outcomes type: ${typeof firstMarket.outcomes} - ${Array.isArray(firstMarket.outcomes) ? 'Array' : 'Not Array'}`);
            console.log(`Outcomes value: ${JSON.stringify(firstMarket.outcomes)}`);
            console.log(`OutcomePrices type: ${typeof firstMarket.outcomePrices} - ${Array.isArray(firstMarket.outcomePrices) ? 'Array' : 'Not Array'}`);
            console.log(`OutcomePrices value: ${JSON.stringify(firstMarket.outcomePrices)}`);

            // Try to parse if it's a string
            if (typeof firstMarket.outcomePrices === 'string') {
                try {
                    const parsed = JSON.parse(firstMarket.outcomePrices);
                    console.log(`Parsed OutcomePrices: ${JSON.stringify(parsed)}`);
                    console.log(`Parsed type: ${typeof parsed} - ${Array.isArray(parsed) ? 'Array' : 'Not Array'}`);
                } catch (e) {
                    console.log(`Cannot parse outcomePrices as JSON: ${e.message}`);
                }
            }
        }

    } catch (error: any) {
        console.error('❌ Raw API test failed:', error.message);
    }
}

testRawPolymarketAPI();