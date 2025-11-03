# 📊 PREDICTIONS SYSTEM DOCUMENTATION

Complete predictions dashboard for Poly402, showing all agent predictions with filtering, sorting, and detailed analysis.

---

## 🎯 FEATURES

### ✅ What You Get

1. **Complete Predictions Dashboard** (`/predictions`)
   - See all agent predictions across all markets
   - Advanced filtering (agent, outcome, status, prediction type)
   - Multiple sorting options (date, confidence, profit/loss)
   - Detailed prediction modals with full context

2. **Real-Time Stats Dashboard**
   - Total predictions count
   - Overall accuracy percentage
   - Total profit/loss tracking
   - Win streak tracking (current + longest)
   - Total research costs
   - YES/NO prediction distribution

3. **Recent Predictions Widget**
   - Live feed of latest 5 predictions
   - Auto-refreshes every 30 seconds
   - Shows on dashboard for quick overview
   - Links to full predictions page

4. **Detailed Prediction Analysis**
   - Full market context and question
   - Agent information and strategy
   - Prediction with confidence level
   - Market price at time of prediction
   - Complete reasoning from AI analysis
   - Research cost breakdown
   - Profit/loss calculation
   - Resolution status and outcome
   - Timestamps for prediction and resolution

---

## 🗂️ FILE STRUCTURE

```
src/
├── app/
│   ├── api/
│   │   └── predictions/
│   │       ├── list/
│   │       │   └── route.ts          # Predictions list API with filtering
│   │       └── stats/
│   │           └── route.ts          # Predictions stats calculations
│   ├── predictions/
│   │   └── page.tsx                  # Main predictions dashboard page
│   └── dashboard/
│       └── page.tsx                  # Updated with predictions link + widget
└── components/
    └── RecentPredictions.tsx         # Recent predictions widget

scripts/
└── test-predictions-system.ts        # Comprehensive test suite

PREDICTIONS_SYSTEM.md                 # This documentation
```

---

## 🔌 API ENDPOINTS

### 1. List Predictions: `GET /api/predictions/list`

Returns a filtered, sorted list of predictions with full agent and market data.

**Query Parameters:**
- `agentId` (string): Filter by specific agent
- `marketId` (string): Filter by specific market
- `prediction` (string): Filter by YES or NO
- `outcome` (string): Filter by resolved outcome (YES/NO)
- `resolved` (boolean): Filter by resolution status
- `correct` (boolean): Filter by correctness
- `sortBy` (string): Sort field (created_at, confidence, profit_loss)
- `sortOrder` (string): Sort direction (asc, desc)
- `limit` (number): Results per page (default: 50)
- `offset` (number): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "predictions": [
    {
      "id": "uuid",
      "prediction": "YES",
      "confidence": 0.75,
      "reasoning": "AI analysis reasoning...",
      "price_at_prediction": 0.65,
      "research_cost": 0.15,
      "outcome": "YES",
      "correct": true,
      "profit_loss": 5.50,
      "created_at": "2025-01-01T12:00:00Z",
      "resolved_at": "2025-01-15T12:00:00Z",
      "agents": {
        "id": "uuid",
        "name": "Agent Alpha",
        "strategy_type": "CONSERVATIVE",
        "generation": 2
      },
      "polymarket_markets": {
        "id": "uuid",
        "question": "Will AI replace doctors by 2030?",
        "market_slug": "ai-doctors-2030",
        "end_date": "2030-01-01T00:00:00Z",
        "yes_price": 0.45,
        "no_price": 0.55,
        "resolved": true,
        "outcome": "YES"
      }
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 50
}
```

**Example Requests:**
```bash
# Get all predictions
curl http://localhost:3000/api/predictions/list

# Get YES predictions only
curl http://localhost:3000/api/predictions/list?prediction=YES

# Get resolved predictions sorted by profit/loss
curl http://localhost:3000/api/predictions/list?resolved=true&sortBy=profit_loss&sortOrder=desc

# Get predictions for specific agent
curl http://localhost:3000/api/predictions/list?agentId=AGENT_UUID
```

---

### 2. Predictions Stats: `GET /api/predictions/stats`

Returns calculated statistics across all predictions or for a specific agent.

**Query Parameters:**
- `agentId` (string, optional): Get stats for specific agent only

**Response:**
```json
{
  "success": true,
  "stats": {
    "total": 150,
    "resolved": 50,
    "unresolved": 100,
    "correct": 35,
    "incorrect": 15,
    "accuracy": "70.00",
    "yesPredictions": 80,
    "noPredictions": 70,
    "totalResearchCost": "75.50",
    "totalProfitLoss": "125.75",
    "avgConfidence": "72.5",
    "currentStreak": 5,
    "longestStreak": 12
  }
}
```

**Stat Definitions:**
- **total**: Total number of predictions made
- **resolved**: Predictions where market has resolved
- **unresolved**: Predictions still pending resolution
- **correct**: Predictions that matched the outcome
- **incorrect**: Predictions that didn't match
- **accuracy**: Percentage correct (correct/resolved * 100)
- **yesPredictions**: Count of YES predictions
- **noPredictions**: Count of NO predictions
- **totalResearchCost**: Sum of all research costs
- **totalProfitLoss**: Net profit/loss across all predictions
- **avgConfidence**: Average confidence level (0-100%)
- **currentStreak**: Current winning streak
- **longestStreak**: Longest winning streak ever

**Example Requests:**
```bash
# Overall stats
curl http://localhost:3000/api/predictions/stats

# Stats for specific agent
curl http://localhost:3000/api/predictions/stats?agentId=AGENT_UUID
```

---

## 🖥️ UI COMPONENTS

### Predictions Dashboard Page

**Location:** `/predictions`

**Features:**
- **Stats Overview**: 5 key metrics at the top
- **Advanced Filters**: Filter by agent, prediction type, status, outcome
- **Sorting Options**: Sort by date, confidence, or profit/loss
- **Predictions List**: All predictions with key info visible
- **Click to Expand**: Click any prediction for full details
- **Detail Modal**: Full prediction context in popup

**Filter Options:**
- **Agent**: Select specific agent or view all
- **Prediction**: YES only, NO only, or both
- **Status**: All, Resolved only, or Pending only
- **Outcome**: All, Correct only, or Incorrect only
- **Sort By**: Date, Confidence, or Profit/Loss

---

### Recent Predictions Widget

**Location:** Dashboard right sidebar

**Features:**
- Shows latest 5 predictions
- Auto-refreshes every 30 seconds
- Compact card display
- Quick prediction type badge
- Confidence percentage
- Link to full predictions page

**Display:**
- Market question (truncated to 60 chars)
- Agent name
- Confidence level
- Timestamp
- YES/NO badge

---

## 🎨 DESIGN SYSTEM

### Aesthetic

All components use the **16-bit pixel videogame aesthetic**:
- Pure white background (`bg-white`)
- Pure black text and borders
- 4px thick borders (`border-4 border-black`)
- Drop shadows (`8px 8px 0px rgba(0,0,0,0.3)`)
- Press Start 2P font
- Unicode characters for icons (▶, ◆, ✓, ✗, etc.)
- No color except black/white/gray

### Color Coding
- **Predictions**: Gray-100 for YES, Gray-200 for NO
- **Outcomes**: Black background with white text for CORRECT, Gray-300 for INCORRECT
- **Stats**: Black text, gray-600 for labels

---

## 🧪 TESTING

### Run Test Suite

```bash
npm run test:predictions
```

**Tests Include:**
1. **Predictions List API**
   - Fetch all predictions
   - Filter by prediction type (YES/NO)
   - Filter by resolved status
   - Sort by confidence

2. **Predictions Stats API**
   - Overall statistics
   - Calculation validation
   - Agent-specific stats

3. **Data Integrity**
   - Missing agent/market data check
   - Resolved predictions have outcomes
   - Profit/loss calculations exist

### Manual Testing Checklist

- [ ] Visit `/predictions` page
- [ ] Verify stats dashboard displays correctly
- [ ] Apply agent filter
- [ ] Apply prediction type filter (YES/NO)
- [ ] Apply status filter (Resolved/Pending)
- [ ] Apply outcome filter (Correct/Incorrect)
- [ ] Sort by date (ascending/descending)
- [ ] Sort by confidence
- [ ] Sort by profit/loss
- [ ] Click on a prediction
- [ ] Verify modal displays all details
- [ ] Close modal
- [ ] Click "View on Polymarket" link
- [ ] Clear all filters
- [ ] Check Recent Predictions widget on dashboard
- [ ] Verify auto-refresh works (wait 30 seconds)
- [ ] Click "VIEW ALL" link in widget

---

## 📊 DATA FLOW

### How Predictions Work

1. **Agent Analysis** (`/api/analyze-trigger/route.ts`)
   - Agent analyzes a Polymarket market
   - AI generates prediction with reasoning
   - Prediction saved to `agent_predictions` table

2. **Market Resolution** (`/api/cron/check-resolutions/route.ts`)
   - Cron job checks for resolved markets
   - Updates market status in database
   - Resolves agent predictions (correct/incorrect)
   - Calculates profit/loss
   - Updates agent stats

3. **Predictions Display**
   - User visits `/predictions` page
   - List API fetches predictions with filters
   - Stats API calculates aggregate metrics
   - UI displays results with full context

---

## 🔍 PREDICTION DETAIL MODAL

### Information Displayed

**Market Context:**
- Full question text
- Link to Polymarket page
- End date

**Agent Information:**
- Agent name
- Strategy type
- Generation (if bred)

**Prediction Details:**
- YES or NO prediction
- Confidence level (0-100%)
- Market price at time of prediction
- Full AI reasoning text

**Financial Data:**
- Research cost (how much spent on data)
- Profit/loss (if resolved)

**Outcome (if resolved):**
- Actual market outcome
- Whether agent was correct
- Resolution timestamp

**Timestamps:**
- When prediction was made
- When market resolved (if applicable)

---

## 🚀 PERFORMANCE

### Optimization Features

1. **Database Indexes**
   - `agent_id` for agent filtering
   - `market_id` for market filtering
   - `created_at` for date sorting
   - `confidence` for confidence sorting

2. **API Pagination**
   - Default limit: 50 predictions
   - Offset-based pagination
   - Total count returned for UI

3. **Component Optimization**
   - Recent Predictions widget: Only fetches 5 predictions
   - Auto-refresh: 30-second interval (not too aggressive)
   - Lazy loading: Details only loaded on modal open

4. **Query Optimization**
   - Single query with JOINs for related data
   - Count query alongside data fetch
   - Efficient filtering at database level

---

## 🎯 USE CASES

### For Users

1. **Monitor Agent Performance**
   - See which agents are making accurate predictions
   - Track profit/loss per agent
   - Identify winning strategies

2. **Analyze Prediction Patterns**
   - Which markets are agents predicting on?
   - What confidence levels lead to success?
   - YES vs NO prediction distribution

3. **Track Financial Performance**
   - Total research spending
   - Net profit/loss across all predictions
   - ROI analysis per agent

4. **Discover Insights**
   - Read AI reasoning for predictions
   - Compare agent strategies
   - Learn from correct vs incorrect predictions

### For Development

1. **Debug Agent Behavior**
   - See what predictions agents are making
   - Analyze reasoning quality
   - Identify edge cases

2. **Validate Resolution Logic**
   - Ensure outcomes are calculated correctly
   - Verify profit/loss calculations
   - Check streak tracking

3. **Performance Monitoring**
   - Overall system accuracy
   - Agent efficiency metrics
   - Research cost optimization

---

## 🐛 TROUBLESHOOTING

### No Predictions Showing

**Possible Causes:**
1. No agents have made predictions yet
   - **Solution**: Wait for agents to analyze markets or trigger manually

2. Filters too restrictive
   - **Solution**: Click "CLEAR ALL" to reset filters

3. Database not configured
   - **Solution**: Check `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

### Stats Not Calculating

**Possible Causes:**
1. No resolved predictions
   - **Solution**: Wait for markets to resolve or manually resolve test markets

2. Database connection issues
   - **Solution**: Check Supabase connection and service role key

### Modal Not Opening

**Possible Causes:**
1. JavaScript error
   - **Solution**: Check browser console for errors

2. Missing prediction data
   - **Solution**: Verify prediction has all required fields

---

## 🔮 FUTURE ENHANCEMENTS

Potential features to add:

1. **Advanced Analytics**
   - Prediction accuracy over time graph
   - Confidence calibration chart
   - Market category breakdown
   - Agent comparison tool

2. **Export Functionality**
   - Export predictions to CSV
   - Download full analysis report
   - Share prediction links

3. **Real-Time Updates**
   - WebSocket for live prediction feed
   - Push notifications for resolutions
   - Live accuracy updates

4. **Prediction Insights**
   - AI-powered pattern recognition
   - Strategy recommendations
   - Risk analysis

5. **Social Features**
   - Comment on predictions
   - Share predictions
   - Follow specific agents
   - Public leaderboards

---

## 📝 NOTES

### Database Schema

Relies on these tables:
- `agent_predictions`: Stores all predictions
- `agents`: Agent information
- `polymarket_markets`: Market data

### Key Relationships

```
agent_predictions
├── agent_id → agents.id
└── market_id → polymarket_markets.id
```

### Win Streak Calculation

Win streak is calculated by:
1. Get all resolved predictions sorted by resolution date (newest first)
2. Start from most recent resolved prediction
3. Count consecutive correct predictions
4. Current streak = consecutive correct from most recent
5. Longest streak = maximum consecutive correct ever

---

## ✅ SUCCESS CRITERIA

You'll know it's working when:

✅ `/predictions` page loads without errors
✅ Stats dashboard shows accurate numbers
✅ Filters work and update results
✅ Sorting changes prediction order
✅ Clicking prediction opens detail modal
✅ Modal shows all prediction info
✅ "View on Polymarket" link works
✅ Recent Predictions widget on dashboard
✅ Widget auto-refreshes
✅ Link from dashboard to predictions works
✅ Win streak calculates correctly
✅ Profit/loss totals are accurate
✅ Accuracy percentage is correct

---

## 🎉 WHAT YOU BUILT

You now have a **complete predictions analytics system** that:

📊 **Shows all agent predictions** across markets
🎯 **Tracks accuracy and performance** in real-time
💰 **Calculates profit/loss** automatically
🔥 **Monitors win streaks** for gamification
🔍 **Provides deep insights** into each prediction
⚡ **Updates live** with recent activity
🎨 **Looks amazing** with pixel aesthetic

This is your **mission control** for the AI prediction marketplace! 🚀

---

**Built with ❤️ for Poly402**

