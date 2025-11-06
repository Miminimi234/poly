/**
 * Test script for the integrated market odds tracker
 * Run with: node test-integrated-tracker.js
 */

const fetch = require('node-fetch');

// Mock Firebase admin (for testing purposes)
global.fetch = fetch;

// Test the integrated tracker logic (without actual Firebase)
class MockIntegratedTracker {
    constructor() {
        this.POLYMARKET_API_BASE = 'https://gamma-api.polymarket.com';
        this.isRunning = false;
    }

    // Simulate the core functionality
    async testIntegratedFlow() {
        console.log('🧪 Testing Integrated Market Odds Tracker Flow...\n');

        // Step 1: Simulate getting agent predictions from Firebase
        const mockPredictions = [
            {
                id: 'pred_1',
                market_id: '516710',
                agent_id: 'agent_1',
                agent_name: 'EconomicAnalyst',
                market_question: 'US recession in 2025?',
                prediction: 'NO',
                bet_amount: 100,
                entry_odds: { yes_price: 0.05, no_price: 0.95 },
                position_status: 'OPEN',
                resolved: false,
                created_at: '2025-11-06T10:00:00Z'
            },
            {
                id: 'pred_2',
                market_id: '516706',
                agent_id: 'agent_2',
                agent_name: 'FedWatcher',
                market_question: 'Fed rate hike in 2025?',
                prediction: 'NO',
                bet_amount: 200,
                entry_odds: { yes_price: 0.02, no_price: 0.98 },
                position_status: 'OPEN',
                resolved: false,
                created_at: '2025-11-06T11:00:00Z'
            }
        ];

        console.log(`📊 Step 1: Found ${mockPredictions.length} agent predictions`);
        mockPredictions.forEach(pred => {
            console.log(`  - ${pred.agent_name}: ${pred.prediction} on "${pred.market_question}" ($${pred.bet_amount})`);
        });

        // Step 2: Group by market_id
        const marketGroups = this.groupPredictionsByMarket(mockPredictions);
        const uniqueMarkets = Object.keys(marketGroups);

        console.log(`\n📊 Step 2: Grouped into ${uniqueMarkets.length} unique markets:`, uniqueMarkets);

        // Step 3: Fetch current odds for each market
        console.log('\n📊 Step 3: Fetching current market odds...');
        const marketOddsMap = new Map();

        for (const marketId of uniqueMarkets) {
            try {
                const odds = await this.fetchMarketOdds(marketId);
                if (odds) {
                    marketOddsMap.set(marketId, odds);
                    console.log(`  ✅ ${marketId}: Yes $${odds.yes_price.toFixed(4)} (${(odds.yes_price * 100).toFixed(1)}%) | No $${odds.no_price.toFixed(4)} (${(odds.no_price * 100).toFixed(1)}%)`);
                }
            } catch (error) {
                console.log(`  ❌ ${marketId}: Failed to fetch odds`);
            }

            // Rate limiting delay
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Step 4: Calculate updates for each prediction
        console.log('\n📊 Step 4: Calculating prediction updates...');

        for (const [marketId, odds] of marketOddsMap) {
            const predictionsForMarket = marketGroups[marketId];

            console.log(`\n  Market ${marketId}:`);

            for (const prediction of predictionsForMarket) {
                const unrealizedPnL = this.calculateUnrealizedPnL(prediction, odds);
                const expectedPayout = this.calculateExpectedPayout(prediction, odds);

                const update = {
                    predictionId: prediction.id,
                    agent: prediction.agent_name,
                    position: prediction.prediction,
                    entryPrice: prediction.prediction === 'YES' ? prediction.entry_odds.yes_price : prediction.entry_odds.no_price,
                    currentPrice: prediction.prediction === 'YES' ? odds.yes_price : odds.no_price,
                    betAmount: prediction.bet_amount,
                    unrealizedPnL: unrealizedPnL,
                    expectedPayout: expectedPayout,
                    originalExpectedPayout: prediction.expected_payout || 0,
                    priceChange: ((prediction.prediction === 'YES' ? odds.yes_price : odds.no_price) - (prediction.prediction === 'YES' ? prediction.entry_odds.yes_price : prediction.entry_odds.no_price)) * 100
                };

                console.log(`    ${update.agent} (${update.position}): Entry $${update.entryPrice.toFixed(4)} → Current $${update.currentPrice.toFixed(4)}`);
                console.log(`      Bet: $${update.betAmount} | Expected Payout: $${update.originalExpectedPayout.toFixed(2)} → $${update.expectedPayout.toFixed(2)} | P&L: $${update.unrealizedPnL.toFixed(2)}`);
            }
        }

        console.log('\n✅ Integrated tracker flow test complete!');
        console.log('\n🎯 In the real system, this would update Firebase with:');
        console.log('  - current_market_odds for each prediction');
        console.log('  - expected_payout (recalculated with current odds)');
        console.log('  - unrealized_pnl calculations');
        console.log('  - updated_at timestamps');
        console.log('  - Running every 5 seconds automatically');
    }

    groupPredictionsByMarket(predictions) {
        const groups = {};
        for (const prediction of predictions) {
            if (!groups[prediction.market_id]) {
                groups[prediction.market_id] = [];
            }
            groups[prediction.market_id].push(prediction);
        }
        return groups;
    }

    async fetchMarketOdds(marketId) {
        const response = await fetch(`${this.POLYMARKET_API_BASE}/markets/${marketId}`, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'poly402-integrated-tracker-test/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        // Use the same fixed parsing logic
        let yesPrice = 0.5;
        let noPrice = 0.5;

        if (data.outcomePrices) {
            try {
                const pricesArray = typeof data.outcomePrices === 'string'
                    ? JSON.parse(data.outcomePrices)
                    : data.outcomePrices;

                if (Array.isArray(pricesArray) && pricesArray.length >= 2) {
                    yesPrice = parseFloat(pricesArray[0]);
                    noPrice = parseFloat(pricesArray[1]);
                }
            } catch (parseError) {
                console.error(`Failed to parse outcomePrices for ${marketId}`);
            }
        }

        return {
            yes_price: yesPrice,
            no_price: noPrice,
            timestamp: new Date().toISOString()
        };
    }

    calculateUnrealizedPnL(prediction, currentOdds) {
        const betAmount = prediction.bet_amount || 0;
        const entryPrice = prediction.prediction === 'YES'
            ? prediction.entry_odds.yes_price
            : prediction.entry_odds.no_price;

        const currentPrice = prediction.prediction === 'YES'
            ? currentOdds.yes_price
            : currentOdds.no_price;

        const priceChange = currentPrice - entryPrice;
        const unrealizedPnl = (priceChange / entryPrice) * betAmount;

        return Math.round(unrealizedPnl * 100) / 100;
    }

    calculateExpectedPayout(prediction, currentOdds) {
        const betAmount = prediction.bet_amount || 0;

        const currentPrice = prediction.prediction === 'YES'
            ? currentOdds.yes_price
            : currentOdds.no_price;

        if (currentPrice > 0) {
            const expectedPayout = betAmount / currentPrice;
            return Math.round(expectedPayout * 100) / 100;
        }

        return betAmount;
    }
}

// Run the test
const mockTracker = new MockIntegratedTracker();
mockTracker.testIntegratedFlow().catch(console.error);