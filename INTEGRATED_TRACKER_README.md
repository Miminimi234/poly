# Integrated Market Odds Tracker System

## 🎯 Overview
The Integrated Market Odds Tracker continuously updates the `current_market_odds` field in all agent predictions every 5 seconds with live Polymarket data.

## 🔄 How It Works

### 1. Data Flow
```
Every 5 seconds:
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Firebase          │    │   Polymarket API    │    │   Firebase          │
│   agent_predictions │ -> │   Live Market Data  │ -> │   Updated           │
│                     │    │                     │    │   current_market_   │
│   market_ids        │    │   outcomePrices     │    │   odds & P&L        │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

### 2. Process Steps
1. **Fetch Predictions**: Get all agent predictions from Firebase
2. **Group by Market**: Organize predictions by `market_id` for efficiency  
3. **API Calls**: Fetch current odds from Polymarket for each unique market
4. **Parse Odds**: Extract real prices using fixed JSON parsing logic
5. **Calculate P&L**: Compute unrealized profit/loss based on price movement
6. **Update Firebase**: Store `current_market_odds` and `unrealized_pnl` for each prediction

## 📁 Files Created

### Core Tracker
- `src/lib/integrated-market-odds-tracker.ts` - Main tracker class
- `src/app/api/tracker/odds/route.ts` - API endpoint for control

### Management Tools  
- `manage-tracker.js` - Command-line management script
- `src/components/TrackerController.tsx` - React dashboard component
- `test-integrated-tracker.js` - Test script to verify functionality

## 🚀 Usage

### 1. Command Line
```bash
# Start the tracker
node manage-tracker.js start

# Check status
node manage-tracker.js status

# Stop the tracker  
node manage-tracker.js stop
```

### 2. Programmatically
```typescript
import integratedMarketOddsTracker from '@/lib/integrated-market-odds-tracker';

// Start tracking
integratedMarketOddsTracker.startTracking();

// Check if running
const isActive = integratedMarketOddsTracker.isTrackingActive();

// Get stats
const stats = await integratedMarketOddsTracker.getTrackingStats();

// Stop tracking
integratedMarketOddsTracker.stopTracking();
```

### 3. Dashboard Component
Add `<TrackerController />` to your dashboard for visual control.

### 4. API Endpoints
```bash
# Start tracker
POST /api/tracker/odds
{ "action": "start" }

# Stop tracker  
POST /api/tracker/odds
{ "action": "stop" }

# Get status
GET /api/tracker/odds
```

## 📊 Data Updates

### Agent Prediction Fields Updated
```typescript
{
  current_market_odds: {
    yes_price: 0.0420,      // Current YES price from Polymarket
    no_price: 0.9580,       // Current NO price from Polymarket  
    timestamp: "2025-11-06T18:00:00Z"
  },
  expected_payout: 104.55,  // Recalculated payout based on current odds
  unrealized_pnl: 0.84,    // Profit/loss based on price movement
  updated_at: "2025-11-06T18:00:00Z"
}
```

### Expected Payout & P&L Calculations
```typescript
// Expected Payout Calculation (what they would get if they won now)
const betAmount = prediction.bet_amount;              // e.g., $100
const currentPrice = current_market_odds.no_price;    // e.g., 0.9565
const expectedPayout = betAmount / currentPrice;      // $104.55

// P&L Calculation (profit/loss from price movement)
const entryPrice = prediction.entry_odds.no_price;    // e.g., 0.95 
const priceChange = currentPrice - entryPrice;        // 0.0065
const unrealizedPnl = (priceChange / entryPrice) * betAmount;  // $0.68
```

## ⚡ Performance Features

- **Efficient Grouping**: Groups predictions by market to minimize API calls
- **Rate Limiting**: 100ms delay between API calls to avoid rate limits
- **Parallel Updates**: Updates all predictions simultaneously for speed
- **Error Handling**: Continues tracking even if individual markets fail
- **Memory Efficient**: Processes data in batches without storing large arrays

## 🎯 Benefits

1. **Real-time P&L**: Agents see live profit/loss on their positions
2. **Market Awareness**: Current market sentiment reflected in predictions
3. **Performance Tracking**: Monitor how predictions perform over time
4. **Risk Management**: See position values changing in real-time
5. **Data Integrity**: Always have up-to-date market context

## 🔧 Configuration

- **Update Frequency**: 5 seconds (configurable in `UPDATE_INTERVAL`)
- **API Base**: `https://gamma-api.polymarket.com`
- **Fallback Odds**: 0.5/0.5 if API fails
- **Rate Limiting**: 100ms between calls

## 📈 Example Output

```
🔄 [Integrated Tracker] Updating prediction odds...
📊 Found 15 predictions across 8 markets
✅ [Integrated Tracker] Updated 15 predictions (8/8 markets) in 2.3s
```

## 🚨 Important Notes

1. **Firebase Rules**: Ensure your Firebase rules allow admin writes to `agent_predictions`
2. **API Limits**: Respects Polymarket rate limits with delays
3. **Error Recovery**: Continues running even if some updates fail  
4. **Memory Usage**: Minimal memory footprint with efficient data processing
5. **Real-time**: Updates happen every 5 seconds when active

The integrated tracker is now ready to keep all your agent predictions up-to-date with live market data! 🎉