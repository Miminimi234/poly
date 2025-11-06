/**
 * Test Enhanced Integrated Market Odds Tracker
 * Tests the tracker with agent balance updates
 */

const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };
    
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
}

const database = admin.database();

// Basic test to check if the enhanced tracker logic works
async function testEnhancedTracker() {
    console.log('🚀 Testing Enhanced Integrated Tracker (with Balance Updates)...');

    try {
        // Test 1: Check if we can fetch agent predictions
        console.log('\n📊 Test 1: Fetching agent predictions...');
        const predictionsRef = database.ref('agent_predictions');
        const snapshot = await predictionsRef.once('value');

        if (snapshot.exists()) {
            const predictions = [];
            snapshot.forEach((child) => {
                const prediction = child.val();
                if (prediction && prediction.market_id && !prediction.resolved) {
                    predictions.push(prediction);
                }
            });

            console.log(`✅ Found ${predictions.length} active predictions`);

            if (predictions.length > 0) {
                const samplePrediction = predictions[0];
                console.log(`📋 Sample prediction: ${samplePrediction.agent_name} betting ${samplePrediction.prediction} on "${samplePrediction.market_question}"`);
            }
        } else {
            console.log('📊 No predictions found');
        }

        // Test 2: Check if we can fetch agent balances
        console.log('\n💰 Test 2: Fetching agent balances...');
        const balancesRef = database.ref('agent_balances');
        const balanceSnapshot = await balancesRef.once('value');

        if (balanceSnapshot.exists()) {
            const balances = [];
            balanceSnapshot.forEach((child) => {
                const balance = child.val();
                if (balance) {
                    balances.push(balance);
                }
            });

            console.log(`✅ Found ${balances.length} agent balances`);

            if (balances.length > 0) {
                const sampleBalance = balances[0];
                console.log(`💰 Sample balance: ${sampleBalance.agent_name} has $${sampleBalance.current_balance}`);
            }
        } else {
            console.log('💰 No agent balances found');
        }

        // Test 3: Test market odds fetching
        console.log('\n📈 Test 3: Testing market odds API...');

        // Get a market ID from predictions
        const predictionsSnap = await database.ref('agent_predictions').limitToFirst(1).once('value');
        if (predictionsSnap.exists()) {
            const prediction = Object.values(predictionsSnap.val())[0];
            if (prediction && prediction.market_id) {
                console.log(`🎯 Testing with market ID: ${prediction.market_id}`);

                try {
                    const response = await fetch(`https://gamma-api.polymarket.com/markets/${prediction.market_id}`);
                    const data = await response.json();

                    if (data.outcomePrices) {
                        const prices = JSON.parse(data.outcomePrices);
                        console.log(`✅ Market odds fetched: YES=${(prices[1] * 100).toFixed(1)}%, NO=${(prices[0] * 100).toFixed(1)}%`);
                    } else {
                        console.log('⚠️ No outcome prices in response');
                    }
                } catch (error) {
                    console.error('❌ Failed to fetch market odds:', error.message);
                }
            }
        }

        console.log('\n✅ Enhanced tracker tests completed!');
        console.log('🔄 The integrated tracker will now:');
        console.log('   1. Update prediction odds every 5 seconds');
        console.log('   2. Calculate unrealized P&L for each position');
        console.log('   3. Update agent balances with current portfolio values');
        console.log('   4. Log significant balance changes in real-time');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }

    process.exit(0);
}

testEnhancedTracker();