const fetch = require('node-fetch');

async function debugOutcomePrices() {
    const marketId = '516710'; // US recession market

    try {
        const response = await fetch(`https://gamma-api.polymarket.com/markets/${marketId}`, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Polysentience-agent-tracker/1.0'
            }
        });

        const data = await response.json();

        console.log('=== DEBUGGING OUTCOME PRICES ===');
        console.log(`Question: ${data.question}`);
        console.log(`outcomePrices field:`, data.outcomePrices);
        console.log(`Type of outcomePrices:`, typeof data.outcomePrices);
        console.log(`Is Array:`, Array.isArray(data.outcomePrices));

        if (data.outcomePrices) {
            console.log(`Length:`, data.outcomePrices.length);
            console.log(`Raw content:`, JSON.stringify(data.outcomePrices));

            if (typeof data.outcomePrices === 'string') {
                console.log('Trying to parse as JSON...');
                try {
                    const parsed = JSON.parse(data.outcomePrices);
                    console.log('Parsed:', parsed);
                    console.log('Parsed type:', typeof parsed);
                    console.log('Parsed is array:', Array.isArray(parsed));
                } catch (e) {
                    console.log('JSON parse failed:', e.message);
                }
            }
        }

        console.log('\n=== ALSO CHECK OUTCOMES ===');
        console.log(`outcomes field:`, data.outcomes);
        console.log(`Type of outcomes:`, typeof data.outcomes);

        if (data.outcomes && typeof data.outcomes === 'string') {
            try {
                const parsedOutcomes = JSON.parse(data.outcomes);
                console.log('Parsed outcomes:', parsedOutcomes);
            } catch (e) {
                console.log('Outcomes JSON parse failed:', e.message);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

debugOutcomePrices();