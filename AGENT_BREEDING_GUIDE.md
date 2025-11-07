# Agent Breeding System - Complete Guide

## Overview

A Pokémon-style breeding system where users can combine two high-performing AI agents to create superior offspring with hybrid strategies, inherited traits, and random mutations.

---

## ✅ What's Implemented

### 1. **Breeding Genetics Engine** (`lib/agent-breeding.ts`)
- Eligibility checking (balance, predictions, status)
- Strategy crossover and hybridization
- Genetic trait inheritance
- Random mutations (15% chance)
- Generation tracking
- Breeding history logging

### 2. **Breeding Modal** (`components/BreedAgentsModal.tsx`)
- 3-step wizard:
  - Step 1: Select first parent
  - Step 2: Select second parent
  - Step 3: Review and confirm
- Real-time eligibility checking
- Cost preview
- Optional offspring naming
- 16-bit pixel aesthetic

### 3. **Breeding APIs**
- `/api/breeding/check` - Check if two agents can breed
- `/api/breeding/breed` - Execute breeding
- `/api/breeding/history` - Get breeding history

### 4. **Database Schema**
- `breeding_history` table for tracking
- New agent columns: `parent1_id`, `parent2_id`, `generation`, `mutations`, `traits`

### 5. **Dashboard Integration**
- "BREED AGENTS" button
- Modal opens on click
- Auto-refresh after breeding
- Shows generation & mutations on agent cards

---

## 🧬 How Breeding Works

### Eligibility Requirements

Both parents must meet ALL criteria:
- ✅ Different agents (can't breed with itself)
- ✅ Not bankrupt
- ✅ Active status
- ✅ At least 5 resolved predictions each
- ✅ Balance ≥ $50 each

### Breeding Process

1. **Parent Selection**
   - User selects two eligible agents
   - System checks eligibility
   - Shows breeding preview

2. **Strategy Hybridization**
   - Offspring gets hybrid strategy
   - Based on parent combination
   - Falls back to random parent if no match

3. **Trait Inheritance**
   - Confidence threshold: Average of parents
   - Research budget: Average of parents
   - Decision speed: Random from parents
   - Risk tolerance: Random from parents

4. **Mutations** (15% chance each)
   - ENHANCED_ACCURACY (+5% confidence)
   - INCREASED_SPEED (forces FAST)
   - RESEARCH_EFFICIENT (20% cheaper)
   - RISK_ADAPTED (performance-based)
   - PATTERN_RECOGNITION
   - CONTRARIAN_BIAS
   - MOMENTUM_SENSITIVE
   - CONSERVATIVE_SHIFT (forces LOW risk)
   - AGGRESSIVE_SHIFT (forces HIGH risk)

5. **Offspring Creation**
   - New agent created in database
   - Unique Solana wallet generated
   - Generation = max(parent gens) + 1
   - Balance = (parent1 + parent2) / 4
   - Parents charged $50 each

---

## 📊 Strategy Combinations

| Parent 1 | Parent 2 | Offspring |
|----------|----------|-----------|
| Conservative | Aggressive | Balanced |
| Conservative | Academic | Conservative |
| Conservative | Speed Demon | Data-Driven |
| Aggressive | Speed Demon | Aggressive |
| Academic | Data-Driven | Academic |
| Balanced | Data-Driven | Data-Driven |
| Aggressive | News Junkie | News Junkie |
| Expert Network | Academic | Expert Network |
| News Junkie | Speed Demon | News Junkie |
| Balanced | Conservative | Balanced |

*Other combinations produce random parent strategy*

---

## 💰 Breeding Economics

### Costs
- **$50** per parent ($100 total)
- Deducted from parent balances
- Non-refundable

### Offspring Balance
```
offspring_balance = (parent1_balance + parent2_balance) / 4
```

**Example:**
- Parent 1: $200
- Parent 2: $300
- Offspring: $125
- Parent 1 after: $150 ($200 - $50)
- Parent 2 after: $250 ($300 - $50)

---

## 🎮 User Flow

### 1. Open Breeding Modal
```
Dashboard → Click "◈ BREED AGENTS" button
```

### 2. Select First Parent
```
Modal shows all eligible agents
├─ Must have $50+ balance
├─ Must have 5+ resolved predictions
├─ Must be active & not bankrupt
└─ Click agent card to select
```

### 3. Select Second Parent
```
Modal shows eligible agents (excluding first parent)
├─ Same eligibility rules
├─ Can change first parent
└─ Click agent card to select
```

### 4. Review & Confirm
```
Shows:
├─ Both parents (stats, strategy)
├─ Eligibility check result
├─ Offspring name field (optional)
├─ Breeding info (cost, generation, balance)
├─ Mutation info (15% chance)
└─ "◈ BREED AGENTS" button
```

### 5. Breeding Complete
```
├─ New agent created
├─ Parents charged $50 each
├─ Modal closes
├─ Dashboard refreshes
└─ New agent appears in list
```

---

## 🗄️ Database Schema

### `breeding_history` table
```sql
CREATE TABLE breeding_history (
  id UUID PRIMARY KEY,
  parent1_id UUID REFERENCES agents(id),
  parent2_id UUID REFERENCES agents(id),
  offspring_id UUID REFERENCES agents(id),
  strategy_combination TEXT,
  offspring_strategy TEXT,
  generation INTEGER,
  mutations TEXT[],
  breeding_cost DECIMAL(10,2),
  created_at TIMESTAMPTZ
);
```

### `agents` table - New columns
```sql
ALTER TABLE agents
ADD COLUMN parent1_id UUID REFERENCES agents(id),
ADD COLUMN parent2_id UUID REFERENCES agents(id),
ADD COLUMN generation INTEGER DEFAULT 0,
ADD COLUMN mutations TEXT[],
ADD COLUMN traits JSONB;
```

### Indexes
```sql
idx_breeding_parents ON breeding_history(parent1_id, parent2_id)
idx_breeding_offspring ON breeding_history(offspring_id)
idx_agents_generation ON agents(generation)
idx_agents_parents ON agents(parent1_id, parent2_id)
```

---

## 🧪 Testing

### API Testing

**Check eligibility:**
```bash
curl -X POST http://localhost:3000/api/breeding/check \
  -H "Content-Type: application/json" \
  -d '{
    "parent1Id": "uuid-1",
    "parent2Id": "uuid-2"
  }'

# Response:
{
  "success": true,
  "canBreed": true
}
```

**Breed agents:**
```bash
curl -X POST http://localhost:3000/api/breeding/breed \
  -H "Content-Type: application/json" \
  -d '{
    "parent1Id": "uuid-1",
    "parent2Id": "uuid-2",
    "offspringName": "ALPHA_NEO_1234"
  }'

# Response:
{
  "success": true,
  "offspring": {
    "id": "new-uuid",
    "name": "ALPHA_NEO_1234",
    "strategy_type": "balanced",
    "parent1_id": "uuid-1",
    "parent2_id": "uuid-2",
    "generation": 1,
    "mutations": ["ENHANCED_ACCURACY", "RESEARCH_EFFICIENT"]
  }
}
```

**Get breeding history:**
```bash
curl http://localhost:3000/api/breeding/history?limit=10
```

### Manual Testing

1. **Create two agents with predictions**
2. **Click "◈ BREED AGENTS"**
3. **Select first parent**
4. **Select second parent**
5. **Review breeding info**
6. **Confirm breeding**
7. **Verify:**
   - New agent created
   - Parents charged $50
   - Generation incremented
   - Mutations applied
   - Offspring has wallet

### Database Verification

```sql
-- Check breeding history
SELECT * FROM breeding_history ORDER BY created_at DESC LIMIT 5;

-- Check offspring
SELECT id, name, generation, mutations, parent1_id, parent2_id 
FROM agents 
WHERE generation > 0;

-- Check parent balances were deducted
SELECT name, current_balance_usdt 
FROM agents 
WHERE id IN ('parent1_id', 'parent2_id');
```

---

## 🎨 UI Design (16-bit Aesthetic)

### Breeding Modal
```
┌────────────────────────────────────────┐
│ ◈ BREED_AGENTS                      ✕ │
├────────────────────────────────────────┤
│                                        │
│ ▶ SELECT_FIRST_PARENT                 │
│                                        │
│ ┌──────────┐  ┌──────────┐           │
│ │ AGENT_A  │  │ AGENT_B  │           │
│ │ GEN 0    │  │ GEN 1    │           │
│ │ 75% ACC  │  │ 82% ACC  │           │
│ │ $200     │  │ $300     │           │
│ └──────────┘  └──────────┘           │
│                                        │
└────────────────────────────────────────┘
```

### Agent Card with Genetics
```
┌────────────────────────────────────────┐
│ ALPHA_NEO_1234          [● ACTIVE]     │
│ BALANCED                                │
├────────────────────────────────────────┤
│ BALANCE: $125     ACCURACY: 78%        │
│                                         │
│ GENETICS:                               │
│ GENERATION: GEN 2                       │
│ ◈ BRED OFFSPRING                        │
│                                         │
│ MUTATIONS:                              │
│ [ENHANCED ACCURACY] [RESEARCH EFFICIENT]│
└────────────────────────────────────────┘
```

---

## ⚠️ Edge Cases & Validation

### Prevented Actions
- ❌ Breeding with self
- ❌ Breeding bankrupt agents
- ❌ Breeding inactive agents
- ❌ Breeding with <5 predictions
- ❌ Breeding with <$50 balance

### Error Messages
```
"Cannot breed an agent with itself"
"Bankrupt agents cannot breed"
"Inactive agents cannot breed"
"Both agents need at least 5 resolved predictions to breed"
"Both agents need at least $50 balance to breed"
```

---

## 📈 Strategic Depth

### Why Breeding Matters

1. **Compound Advantages**
   - Combine high accuracy with high ROI
   - Inherit best traits from both parents
   - Build multi-generational dynasties

2. **Evolution**
   - Gen 2+ agents have superior traits
   - Mutations provide unexpected advantages
   - Long-term strategy evolution

3. **Competitive Meta**
   - Top performers can breed
   - Create agent lineages
   - Optimize for specific markets

4. **Economic Balance**
   - Breeding costs prevent spam
   - Requires successful parents
   - Investment in long-term success

---

## 🚀 Future Enhancements (Not Implemented)

### Planned Features:
- [ ] Breeding cooldown (prevent spam)
- [ ] Trait marketplace (buy/sell genetics)
- [ ] Family trees (visualize lineage)
- [ ] Breeding leaderboards
- [ ] Mutation rarity tiers
- [ ] Trait recombination odds
- [ ] Breeding tournaments
- [ ] Agent retirement system
- [ ] Hall of fame for gen 10+ agents

---

## 📝 Files Created/Modified

### New Files (8):
- ✅ `src/lib/agent-breeding.ts` - Genetics engine
- ✅ `src/components/BreedAgentsModal.tsx` - Breeding modal
- ✅ `src/app/api/breeding/check/route.ts` - Check API
- ✅ `src/app/api/breeding/breed/route.ts` - Breed API
- ✅ `src/app/api/breeding/history/route.ts` - History API
- ✅ `supabase/migrations/add_breeding_system.sql` - DB migration
- ✅ `AGENT_BREEDING_GUIDE.md` - This file

### Modified Files (2):
- ✅ `src/app/dashboard/page.tsx` - Added breed button & modal
- ✅ `src/components/AgentPredictionCard.tsx` - Shows genetics

---

## ✨ Key Features

### Genetic Traits
```typescript
{
  confidence_threshold: 0.75,      // 55-85%
  research_budget_ratio: 0.10,     // 5-20%
  decision_speed: 'FAST',          // FAST/MEDIUM/SLOW
  risk_tolerance: 'MEDIUM',        // LOW/MEDIUM/HIGH
  research_depth: 'MODERATE'       // SHALLOW/MODERATE/DEEP
}
```

### Mutations
- 9 possible mutations
- 15% chance each
- Stackable effects
- Displayed on agent cards

### Auto-generated Names
```
Prefixes: ALPHA, BETA, GAMMA, DELTA, OMEGA, NOVA, APEX, PRIME
Suffixes: X, II, NEO, PRO, ELITE, PLUS, MAX, ULTRA
Format: {PREFIX}_{SUFFIX}_{TIMESTAMP}
Example: ALPHA_NEO_1234
```

---

## 🏆 Success Criteria - ALL MET

✅ "BREED AGENTS" button on dashboard  
✅ Modal shows eligible agents only  
✅ Can select two different parents  
✅ Eligibility check runs automatically  
✅ Shows breeding cost and info  
✅ Can optionally name offspring  
✅ Breeding creates new agent in database  
✅ Parents are charged $50 each  
✅ Offspring has hybrid strategy  
✅ Generation number increments  
✅ Mutations are applied randomly  
✅ Agent card shows generation and mutations  
✅ Unicode icons only (no emojis)  
✅ 16-bit pixel aesthetic maintained  

---

## 🎯 Summary

**System Status:** ✅ Fully Implemented  
**Breeding Cost:** $100 ($50 per parent)  
**Min Requirements:** 5 predictions, $50 balance  
**Mutation Rate:** 15% per trait  
**Strategy Combinations:** 10 predefined + fallback  
**Generation Tracking:** Unlimited  

**Result:** A complete Pokémon-style breeding system for creating superior AI agents through genetic crossover, trait inheritance, and random mutations! 🧬

---

**Ready for:** Production use, competitive breeding meta, agent evolution strategies! 🚀

