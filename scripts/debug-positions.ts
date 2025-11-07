/**
 * Debug script to check why positions aren't showing up
 */

import { firebaseAgentPredictions } from '../src/lib/firebase-agent-predictions';

async function debugPositions() {
    console.log('🔍 Debugging position detection...');

    try {
        // Test 1: Get all predictions first
        console.log('\n📊 Test 1: Getting all predictions...');
        const allPredictions = await firebaseAgentPredictions.getRecentPredictions(10);
        console.log(`Found ${allPredictions.length} total predictions`);

        allPredictions.forEach((pred, i) => {
            console.log(`${i + 1}. ${pred.agent_name} - Status: ${pred.position_status} - Bet: $${pred.bet_amount}`);
        });

        // Test 2: Get open positions specifically
        console.log('\n🎯 Test 2: Getting open positions...');
        const openPositions = await firebaseAgentPredictions.getOpenPositions();
        console.log(`Found ${openPositions.length} open positions`);

        openPositions.forEach((pos, i) => {
            console.log(`${i + 1}. ${pos.agent_name} - ${pos.market_question.slice(0, 50)}... - $${pos.bet_amount} - P&L: $${pos.unrealized_pnl || 0}`);
        });

        // Test 3: Check raw data structure
        console.log('\n🔍 Test 3: Checking raw prediction structure...');
        if (allPredictions.length > 0) {
            const sample = allPredictions[0];
            console.log('Sample prediction fields:');
            console.log('- position_status:', sample.position_status);
            console.log('- bet_amount:', sample.bet_amount);
            console.log('- unrealized_pnl:', sample.unrealized_pnl);
            console.log('- resolved:', sample.resolved);
        }

    } catch (error) {
        console.error('❌ Debug failed:', error);
    }
}

debugPositions().then(() => {
    console.log('✅ Debug complete');
    process.exit(0);
}).catch(error => {
    console.error('❌ Debug script failed:', error);
    process.exit(1);
});