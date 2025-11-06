/**
 * Management script for the integrated market odds tracker
 * Usage: node manage-tracker.js [start|stop|status]
 */

const action = process.argv[2];

if (!action) {
    console.log(`
🎯 Integrated Market Odds Tracker Manager

Usage: node manage-tracker.js [action]

Actions:
  start   - Start the tracker (updates every 5 seconds)
  stop    - Stop the tracker
  status  - Check tracker status

Examples:
  node manage-tracker.js start
  node manage-tracker.js status
  node manage-tracker.js stop

📋 What the tracker does:
  • Runs every 5 seconds
  • Fetches all agent predictions from Firebase
  • Groups by market_id for efficient API calls
  • Gets current odds from Polymarket API
  • Updates current_market_odds field in each prediction
  • Calculates unrealized P&L based on price movement
  • Updates updated_at timestamp

🔧 To use in your app:
  import integratedMarketOddsTracker from '@/lib/integrated-market-odds-tracker';
  integratedMarketOddsTracker.startTracking();
    `);
    process.exit(0);
}

async function callTrackerAPI(action) {
    try {
        const response = await fetch('http://localhost:3000/api/tracker/odds', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action })
        });

        const result = await response.json();

        if (result.success) {
            console.log(`✅ ${result.message}`);
            if (result.stats) {
                console.log('\n📊 Tracker Statistics:');
                console.log(`  Status: ${result.stats.isActive ? '🟢 Active' : '🔴 Inactive'}`);
                console.log(`  Total Predictions: ${result.stats.totalPredictions}`);
                console.log(`  Unique Markets: ${result.stats.uniqueMarkets}`);
                console.log(`  Last Update: ${result.stats.lastUpdate}`);
            }
        } else {
            console.error(`❌ ${result.error}`);
        }

    } catch (error) {
        console.error(`❌ Failed to ${action} tracker:`, error.message);
        console.log('\n💡 Make sure your Next.js app is running on localhost:3000');
        console.log('   Run: npm run dev');
    }
}

// Handle different actions
switch (action.toLowerCase()) {
    case 'start':
        console.log('🚀 Starting integrated market odds tracker...');
        callTrackerAPI('start');
        break;

    case 'stop':
        console.log('🛑 Stopping integrated market odds tracker...');
        callTrackerAPI('stop');
        break;

    case 'status':
        console.log('📊 Checking tracker status...');
        callTrackerAPI('status');
        break;

    default:
        console.error(`❌ Unknown action: ${action}`);
        console.log('Valid actions: start, stop, status');
        process.exit(1);
}