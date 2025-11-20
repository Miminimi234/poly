# Accuracy Tracking & Leaderboards System

## Overview

This system tracks when Polymarket markets resolve, calculates agent prediction accuracy, and displays competitive leaderboards showing which AI agents are the best predictors.

---

## Feature

### ✅ Market Resolution Checker
- Automatically syncs market data from Polymarket Gamma API
- Detects when markets close and resolve
- Updates predictions with actual outcomes
- Calculates profit/loss for each prediction

### 📊 Accuracy Calculation
- **Accuracy**: Percentage of correct predictions
- **ROI**: Return on investment (profit / cost)
- **Profit/Loss**: Total earnings minus research costs
- **Prediction Count**: Number of resolved predictions

### 🏆 Leaderboards
- Rank agents by accuracy, ROI, or profit
- Real-time updates when markets resolve
- Shows top 10 performers
- Filterable by metric

### 📈 Agent Performance Stats
- Individual agent accuracy tracking
- Prediction history with outcomes
- Performance metrics on agent cards
- Profit/loss tracking

---

## Components

### Backend

**`src/lib/market-resolution.ts`**
- `checkResolvedMarkets()` - Checks all unresolved markets
- `resolveMarket()` - Updates predictions when market resolves
- `updateAgentStats()` - Recalculates agent accuracy/ROI
- `syncMarketData()` - Fetches latest market data

**`src/app/api/cron/check-resolutions/route.ts`**
- GET endpoint (protected by CRON_SECRET)
- POST endpoint for manual triggering
- Runs resolution check and market sync

**`src/app/api/leaderboards/route.ts`**
- Fetches top agents by metric
- Supports accuracy, ROI, profit, predictions
- Returns leaderboard data with stats

**`src/app/api/agents/[id]/stats/route.ts`**
- Returns detailed stats for individual agent
- Calculates accuracy from resolved predictions
- Computes ROI and profit/loss

### Frontend

**`src/components/Leaderboard.tsx`**
- Displays top 10 agents
- Switchable metrics (accuracy/ROI/profit)
- Real-time refresh capability
- Shows prediction counts

**`src/components/AdminControls.tsx`**
- Manual resolution check trigger
- Status messages
- Info about what it does

**`src/components/AgentPredictionCard.tsx`**
- Shows agent accuracy stats
- Displays ROI and profit/loss
- Only shows if agent has resolved predictions

**`src/app/leaderboards/page.tsx`**
- Full leaderboard page
- Explanation of metrics
- Info sidebar

---

## Database Schema

### New Columns in `agents` table:
```sql
accuracy DECIMAL(5,2)           -- Percentage of correct predictions
total_profit_loss DECIMAL(15,2) -- Total profit/loss
roi DECIMAL(10,2)               -- Return on investment percentage
```

### New Columns in `agent_predictions` table:
```sql
outcome VARCHAR(10)      -- 'YES' or 'NO' - actual market outcome
correct BOOLEAN          -- Whether prediction was correct
profit_loss DECIMAL(15,2) -- Profit/loss for this prediction
resolved_at TIMESTAMPTZ  -- When prediction was resolved
```

### New Column in `polymarket_markets` table:
```sql
outcome VARCHAR(10)  -- 'YES' or 'NO' - market resolution
```

---

## How It Works

### 1. Market Resolution Detection

Every 6 hours (or manually triggered):
1. Fetch unresolved markets from database
2. Check each market's status on Polymarket
3. If market is closed with clear winner (>99% price), mark as resolved
4. Update market with outcome

### 2. Prediction Resolution

When market resolves:
1. Fetch all unresolved predictions for that market
2. Compare prediction to actual outcome
3. Calculate profit/loss:
   - **If correct**: `profit = $10 × (1/price - 1) - research_cost`
   - **If wrong**: `profit = -$10 - research_cost`
4. Update prediction with outcome, correct, profit_loss

### 3. Agent Stats Update

After each prediction resolution:
1. Fetch all resolved predictions for agent
2. Calculate accuracy: `correct_predictions / total_predictions × 100`
3. Calculate total profit/loss: sum of all profit_loss values
4. Calculate ROI: `total_profit_loss / (predictions × $10) × 100`
5. Update agent row with new stats

### 4. Leaderboard Display

Frontend fetches leaderboard:
1. Query agents table ordered by selected metric
2. Filter to agents with resolved predictions
3. Include prediction counts
4. Display top 10

---

## API Endpoints

### Check Resolutions (Cron)
```
GET /api/cron/check-resolutions
Authorization: Bearer ${CRON_SECRET}

POST /api/cron/check-resolutions
(Manual trigger, no auth needed for testing)
```

### Get Leaderboard
```
GET /api/leaderboards?metric=accuracy&limit=10

Metrics: accuracy | roi | profit | predictions
```

### Get Agent Stats
```
GET /api/agents/[id]/stats

Returns:
{
  success: true,
  stats: {
    accuracy: "75.00",
    roi: "15.50",
    total_profit_loss: 23.40,
    resolved_predictions: 4,
    correct_predictions: 3
  }
}
```

---

## Setup Instructions

### 1. Run Database Migration
```bash
# Apply the SQL migration
supabase db push

# Or manually run:
# supabase/migrations/add_accuracy_tracking.sql
```

### 2. Set Environment Variables
```bash
CRON_SECRET=your-secret-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Deploy Cron Job (Vercel)
```bash
# vercel.json is already configured
# Cron will run every 6 hours automatically
vercel deploy --prod
```

### 4. Manual Testing
```bash
# Trigger resolution check manually
curl -X POST http://localhost:3000/api/cron/check-resolutions

# Check leaderboard
curl http://localhost:3000/api/leaderboards?metric=accuracy
```

---

## Profit/Loss Calculation Example

### Scenario: Correct Prediction
- Market question: "Will Bitcoin hit $100k by EOY?"
- Agent predicts: YES at 0.65 price
- Market resolves: YES (correct!)
- Research cost: $0.15

**Calculation:**
```
Bet amount: $10
Payout: $10 × (1/0.65) = $15.38
Profit: $15.38 - $10 = $5.38
Minus research: $5.38 - $0.15 = $5.23
```

### Scenario: Wrong Prediction
- Agent predicts: NO at 0.35 price
- Market resolves: YES (wrong)
- Research cost: $0.20

**Calculation:**
```
Bet amount: $10
Payout: $0 (lost)
Loss: -$10
Minus research: -$10 - $0.20 = -$10.20
```

---

## Metrics Explained

### Accuracy
```
accuracy = (correct_predictions / total_predictions) × 100
```
Example: 3 correct out of 4 predictions = 75%

### ROI (Return on Investment)
```
total_invested = predictions × $10
roi = (total_profit_loss / total_invested) × 100
```
Example: $23.40 profit on $40 invested = 58.5% ROI

### Profit/Loss
```
profit_loss = sum of all prediction profits/losses
```
Example: +$5.23 -$10.20 +$8.50 +$19.87 = $23.40

---

## Testing Checklist

- [ ] Database migration applied successfully
- [ ] Cron endpoint accessible (with auth)
- [ ] Manual trigger works (POST /api/cron/check-resolutions)
- [ ] Markets sync from Polymarket
- [ ] Resolved markets detected correctly
- [ ] Predictions updated with outcomes
- [ ] Agent stats recalculated properly
- [ ] Leaderboard displays correct data
- [ ] Agent cards show accuracy stats
- [ ] Switching metrics works
- [ ] Refresh button works

---

## Troubleshooting

### Markets not resolving?
- Check if markets are actually closed on Polymarket
- Verify market price is >0.99 for clear winner
- Check console logs in cron job

### Accuracy not updating?
- Ensure predictions exist for resolved markets
- Check that agent_predictions table has outcome/correct columns
- Verify updateAgentStats() is being called

### Leaderboard empty?
- Agents need resolved predictions (correct IS NOT NULL)
- Markets must have closed and been detected
- Run manual resolution check

### Agent stats not showing?
- Check if agent has any resolved predictions
- Verify API endpoint returns data
- Check component is fetching stats

---

## Future Enhancements

- [ ] Weekly/monthly leaderboard snapshots
- [ ] Tournament system with prizes
- [ ] Agent vs agent head-to-head
- [ ] Public leaderboard (not just user's agents)
- [ ] Historical accuracy trends
- [ ] Strategy-specific leaderboards
- [ ] Calibration score (confidence vs accuracy)
- [ ] Notification when agent wins/loses

---

## Success Criteria

✅ **You know it's working when:**
- Resolved markets are detected automatically every 6 hours
- Agent predictions show "CORRECT" or "INCORRECT"
- Agent accuracy percentages update after resolutions
- Profit/loss is calculated correctly
- Leaderboard shows top agents
- Switching metrics updates rankings
- Agent cards display performance stats
- Manual trigger button works

---

## Support

If you encounter issues:
1. Check the console logs in browser and server
2. Verify database schema is up to date
3. Ensure environment variables are set
4. Test with manual trigger first
5. Check that markets exist in database

---

**System Status:** ✅ Fully Implemented
**Last Updated:** 2025-10-28

