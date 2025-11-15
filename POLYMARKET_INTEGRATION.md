# Polysentience + Polymarket Integration

## ✅ What's Implemented

### 1. Database Schema
- `polymarket_markets` table - Stores tracked markets
- `agent_predictions` table - Stores agent predictions with confidence scores
- Indexes for performance
- Function to increment agent prediction counts

### 2. API Routes
- `/api/polymarket/markets` - Fetch live markets from Polymarket
- `/api/predictions` - GET/POST predictions
- `/api/analyze-trigger` - Trigger analysis for all agents

### 3. AI Analysis System
- `lib/polymarket-analysis.ts` - Core analysis logic
- Market filtering based on volume, time, strategy
- Research data purchase simulation
- Claude API integration (with mock fallback)
- Strategy-specific confidence thresholds
- Automatic prediction saving

### 4. UI Components
- `PolymarketMarkets.tsx` - Live market feed
- `AgentPredictionCard.tsx` - Agent cards with predictions
- Dashboard integration with auto-refresh
- Manual "ANALYZE NOW" button per agent

### 5. Automation
- Auto-analysis on dashboard load
- 10-minute refresh interval
- Background processing for multiple agents
- Async analysis to avoid blocking

---

## 🎯 How It Works

1. **User visits dashboard** → Analysis triggers for all active agents
2. **Agent scans markets** → Filters by volume, date, strategy preferences
3. **Agent buys research** → Uses  (simulated for now)
4. **Claude analyzes** → Returns YES/NO prediction with confidence
5. **Prediction saved** → Stored in database with reasoning
6. **UI updates** → Shows latest prediction on agent card
7. **Auto-repeat** → Every 10 minutes

---

## 🔧 Setup Instructions

### 1. Run Database Migration
```bash
# Apply the migration in Supabase SQL Editor
# Run the contents of: supabase/migrations/20250128_polymarket_predictions.sql
```

### 2. Add Environment Variables
```bash
# .env.local
ANTHROPIC_API_KEY=your_anthropic_api_key  # Optional - uses mock if not set
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # Or your deployment URL
```

### 3. Install & Run
```bash
npm install
npm run dev
```

### 4. Test It
1. Create an agent at `/agents/create`
2. Go to `/dashboard`
3. Wait 5 seconds for analysis to complete
4. See prediction appear on agent card
5. Click "ANALYZE NOW" for manual trigger

---

## 📊 Features

### Agent Cards Show:
- ✅ Latest prediction (YES/NO)
- ✅ Confidence score (0-100%)
- ✅ Reasoning excerpt
- ✅ Market question
- ✅ Manual analyze button
- ✅ Total predictions count

### Analysis Logic:
- ✅ Strategy-specific filtering
- ✅ Confidence thresholds per strategy
- ✅ Preferred research sources per strategy
- ✅ Mock analysis if Claude API unavailable
- ✅ Async processing for multiple agents

### Markets Display:
- ✅ Live Polymarket feed
- ✅ YES/NO probabilities
- ✅ Volume data
- ✅ End dates
- ✅ Links to Polymarket
- ✅ Auto-refresh every 5 minutes

---

## 🚀 Next Steps (Optional)

### Phase 2: Accuracy Tracking
```sql
-- When markets resolve, update predictions:
UPDATE agent_predictions 
SET 
  outcome = 'YES' or 'NO',
  correct = (prediction = outcome),
  resolved_at = NOW()
WHERE market_id = 'resolved_market_id';

-- Then update agent accuracy:
UPDATE agents 
SET accuracy = (
  SELECT AVG(CASE WHEN correct THEN 100 ELSE 0 END)
  FROM agent_predictions
  WHERE agent_id = agents.id AND resolved_at IS NOT NULL
)
WHERE id = 'agent_id';
```

### Phase 3: Leaderboards
- Track accuracy per agent
- Track profit/loss (simulated)
- Rank agents by performance
- Show on `/leaderboards` page

### Phase 4: Real Trading
- Integrate CLOB API
- Place actual bets
- Track real P&L
- Implement wallet funding

### Phase 5: Advanced Features
- Agent breeding (combine strategies)
- Tournament mode
- Social features (follow agents)
- Real-time notifications

---

## 🐛 Troubleshooting

### No predictions showing?
- Check console for errors
- Verify agents are `is_active: true`
- Verify markets have enough volume
- Try clicking "ANALYZE NOW" manually

### Analysis not triggering?
- Check `/api/analyze-trigger` endpoint works
- Verify Supabase connection
- Check agent balance > 0

### Claude API errors?
- System falls back to mock analysis automatically
- Check `ANTHROPIC_API_KEY` is set
- Mock analysis works fine for testing

---

## 📝 API Examples

### Trigger Analysis Manually
```bash
curl -X POST http://localhost:3000/api/analyze-trigger
```

### Get Agent Predictions
```bash
curl http://localhost:3000/api/predictions?agentId=YOUR_AGENT_ID&limit=5
```

### Get Polymarket Markets
```bash
curl http://localhost:3000/api/polymarket/markets?limit=10
```

---

## ✨ Success Indicators

You'll know it's working when:
- ✅ Dashboard loads without errors
- ✅ Polymarket feed shows live markets
- ✅ Console shows "Analysis triggered: ..." message
- ✅ Agent cards show predictions after 5-10 seconds
- ✅ "ANALYZE NOW" button works
- ✅ Predictions saved in database
- ✅ Auto-refresh every 10 minutes

---

## 🎮 Strategy Types & Behaviors

| Strategy | Confidence Threshold | Preferred Sources | Behavior |
|----------|---------------------|-------------------|----------|
| Conservative | 80% | Academic, News | Only high-confidence bets |
| Aggressive | 60% | Web | Takes more risks |
| Speed Demon | 55% | Web | Fast decisions, high volume only |
| Academic | 75% | Academic, Expert | Deep analysis required |
| Data Driven | 70% | Web, News | Quantitative focus |
| Balanced | 70% | Web | General purpose |
| News Junkie | 65% | News, Web | Follows trends |
| Expert Network | 65% | Expert | Trusts expert opinions |

---

## 🔥 System Architecture

```
User Opens Dashboard
    ↓
POST /api/analyze-trigger
    ↓
runAgentAnalysis(agentId) [for each agent]
    ↓
GET /api/polymarket/markets
    ↓
analyzeMarket(agent, market, strategy)
    ↓
shouldAnalyzeMarket() [filter]
    ↓
buyResearch() [ simulation]
    ↓
getAIAnalysis() [Claude or mock]
    ↓
POST /api/predictions [save]
    ↓
AgentPredictionCard [displays]
```

---

## 💪 What You Have Now

🔥 **Fully functional autonomous prediction agents**
📊 **Real Polymarket integration**
🤖 **AI-powered analysis**
💾 **Persistent prediction storage**
🎨 **Clean UI matching Polysentience aesthetic**
⚡ **Auto-refresh & manual triggers**
🎯 **Strategy-specific behaviors**

**Your agents are now live and predicting real markets!** 🚀

