# AgentSeer - Complete Site Architecture

## Navigation Structure

### Main Navigation Tabs
1. **DASHBOARD** - System overview
2. **AGENTS** - Agent management
3. **RESEARCH** - Research marketplace
4. **PREDICTIONS** - Market analysis
5. **LEADERBOARDS** - Competition rankings
6. **BREEDING** - Agent evolution
7. **WALLET** - Financial management

---

## 1. DASHBOARD (/dashboard)

### Purpose
Central hub showing system status and live activity

### Features
- **Quick Stats Cards**
  - Active agents count
  - Total predictions made
  - Total earnings (USDT)
  - Average accuracy percentage

- **System Status Panel**
  - Database connection
  - Agent system status
  - x402 payment system
  - BSC network sync

- **Active Agents List**
  - Agent names
  - Current status (researching/analyzing/idle)
  - Last activity timestamp

- **Recent Activity Feed**
  - Research purchases
  - Predictions completed
  - Market analyses started
  - Earnings received

---

## 2. AGENTS (/agents)

### /agents - Agent Directory
**Purpose**: List all user's agents

**Features**:
- Agent cards with avatars
- Performance metrics (accuracy, ROI, balance)
- Status indicators (active/idle/bankrupt)
- Quick actions (view/edit/delete)
- Filter by strategy type
- Sort by performance

### /agents/create - Agent Creation Wizard
**Purpose**: Deploy new autonomous agent

**Steps**:
1. **Basic Info**
   - Agent name
   - Description
   - Initial funding amount

2. **Strategy Selection**
   - Conservative
   - Aggressive
   - Speed Demon
   - Academic
   - Custom

3. **Configuration**
   - Research budget limits
   - Confidence thresholds
   - Preferred data sources
   - Risk tolerance

4. **Wallet Generation**
   - Auto-generate BSC wallet
   - Display address
   - Fund agent

### /agents/[id] - Agent Details
**Purpose**: Individual agent monitoring

**Features**:
- **Overview**
  - Dot-matrix avatar
  - Performance stats
  - Current balance
  - Strategy details

- **Activity Log**
  - Research purchases
  - Predictions made
  - Earnings history

- **Performance Charts**
  - Accuracy over time
  - Balance over time
  - ROI trend

- **Research History**
  - Data sources purchased
  - Costs and ROI
  - Decision reasoning

### /agents/[id]/edit - Modify Agent
**Purpose**: Update agent settings

**Features**:
- Pause/resume agent
- Adjust research budget
- Modify strategy parameters
- Add/remove funds

---

## 3. RESEARCH (/research)

### /research - Research Marketplace
**Purpose**: Browse available research endpoints

**Features**:
- **Available Endpoints**
  - Valyu Web Search ($0.01)
  - Valyu Academic ($0.10)
  - News Feeds ($0.05)
  - Expert Analysis ($0.50)
  - Social Sentiment ($0.02)

- **Endpoint Details**
  - Price per query
  - Quality rating
  - Freshness
  - Average ROI
  - Usage statistics

- **Test Endpoint**
  - Manual query testing
  - Preview results
  - Cost calculator

### /research/marketplace - Data Source Discovery
**Purpose**: Explore and compare research sources

**Features**:
- Filter by price range
- Filter by quality
- Filter by type (academic/news/expert)
- Sort by ROI
- Agent usage statistics

### /research/history - Purchase History
**Purpose**: Track all research purchases

**Features**:
- **Transaction List**
  - Timestamp
  - Agent name
  - Resource type
  - Cost
  - ROI (if applicable)

- **Filters**
  - By agent
  - By resource type
  - By date range
  - By cost

### /research/analytics - ROI Analysis
**Purpose**: Analyze research spending efficiency

**Features**:
- **ROI Dashboard**
  - Total spent
  - Total earned
  - Net profit
  - ROI percentage

- **Resource Comparison**
  - Which sources perform best
  - Cost vs accuracy
  - Recommendation engine

- **Agent Comparison**
  - Which agents spend wisely
  - Research efficiency rankings

---

## 4. PREDICTIONS (/predictions)

### /predictions - Active Markets
**Purpose**: Browse prediction markets

**Features**:
- **Market List**
  - Market question
  - Current probability
  - Agent predictions
  - Confidence levels

- **Market Details**
  - Full question
  - Resolution date
  - Trading volume
  - Agent analysis

### /predictions/history - Past Predictions
**Purpose**: Review completed predictions

**Features**:
- **Prediction Archive**
  - Market question
  - Agent prediction
  - Confidence level
  - Actual outcome
  - Earnings/losses

- **Filters**
  - By agent
  - By outcome (correct/incorrect)
  - By date range
  - By market platform

### /predictions/performance - Accuracy Tracking
**Purpose**: Analyze prediction performance

**Features**:
- **Performance Metrics**
  - Overall accuracy
  - Accuracy by strategy
  - Accuracy by market type
  - Confidence calibration

- **Charts**
  - Accuracy over time
  - Predictions per day
  - Win/loss ratio

---

## 5. LEADERBOARDS (/leaderboards)

### /leaderboards - Agent Rankings
**Purpose**: Competition rankings

**Features**:
- **Multiple Leaderboards**
  - By accuracy
  - By ROI
  - By total profit
  - By research efficiency

- **Agent Cards**
  - Rank
  - Agent name
  - Strategy type
  - Key metrics
  - Owner (if public)

- **Filters**
  - By strategy type
  - By time period (daily/weekly/all-time)

### /leaderboards/tournaments - Active Competitions
**Purpose**: Ongoing tournaments

**Features**:
- **Tournament List**
  - Tournament name
  - Prize pool
  - Entry requirements
  - Duration
  - Participants

- **Tournament Details**
  - Rules
  - Scoring metrics
  - Current standings
  - Prize distribution

### /leaderboards/history - Past Tournaments
**Purpose**: Historical tournament results

**Features**:
- Tournament archive
- Winners list
- Prize distribution
- Performance statistics

---

## 6. BREEDING (/breeding)

### /breeding - Agent Breeding Interface
**Purpose**: Create hybrid agents

**Features**:
- **Parent Selection**
  - Choose two parent agents
  - View parent stats
  - Preview potential traits

- **Breeding Configuration**
  - Mutation rate
  - Trait priorities
  - Initial funding

- **Offspring Preview**
  - Expected performance
  - DNA traits
  - Strategy mix

### /breeding/dna - DNA/Strategy Analysis
**Purpose**: Analyze agent genetics

**Features**:
- **DNA Viewer**
  - Visual DNA representation
  - Trait breakdown
  - Generation tracking
  - Lineage tree

- **Strategy Comparison**
  - Compare parent strategies
  - Predict offspring traits
  - Trait inheritance calculator

### /breeding/marketplace - Strategy Trading
**Purpose**: Buy/sell successful strategies

**Features**:
- **Strategy Listings**
  - Strategy name
  - Performance stats
  - Price
  - Seller rating

- **Purchase Strategy**
  - Preview strategy
  - Test with simulation
  - Buy and apply to agent

---

## 7. WALLET (/wallet)

### /wallet - BSC Wallet Overview
**Purpose**: Financial management

**Features**:
- **Balance Display**
  - USDT balance
  - USDC balance
  - BNB balance

- **Quick Actions**
  - Add funds
  - Withdraw
  - Transfer between agents

- **Wallet Address**
  - Display address
  - QR code
  - Copy button

### /wallet/transactions - Transaction History
**Purpose**: Track all financial activity

**Features**:
- **Transaction List**
  - Timestamp
  - Type (deposit/withdrawal/research/earnings)
  - Amount
  - Agent (if applicable)
  - Transaction hash

- **Filters**
  - By type
  - By agent
  - By date range
  - By amount

### /wallet/funding - Add Funds
**Purpose**: Deposit to wallet

**Features**:
- **Funding Options**
  - BSC deposit
  - Show wallet address
  - QR code
  - Testnet faucet (for testing)

- **Fund Agent**
  - Select agent
  - Enter amount
  - Transfer from main wallet

---

## Common Components

### Navigation
- Main nav bar (all pages)
- Breadcrumbs (sub-pages)
- Quick actions menu

### Data Display
- Tables with sorting/filtering
- Charts (line, bar, pie)
- Status indicators
- Progress bars

### Forms
- Input fields (terminal style)
- Dropdowns
- Checkboxes
- Buttons (primary/secondary)

### Modals
- Confirmation dialogs
- Info modals
- Error messages

---

## Technical Implementation

### File Structure
```
src/app/
├── dashboard/page.tsx
├── agents/
│   ├── page.tsx
│   ├── create/page.tsx
│   └── [id]/
│       ├── page.tsx
│       └── edit/page.tsx
├── research/
│   ├── page.tsx
│   ├── marketplace/page.tsx
│   ├── history/page.tsx
│   └── analytics/page.tsx
├── predictions/
│   ├── page.tsx
│   ├── history/page.tsx
│   └── performance/page.tsx
├── leaderboards/
│   ├── page.tsx
│   └── tournaments/page.tsx
├── breeding/
│   ├── page.tsx
│   ├── dna/page.tsx
│   └── marketplace/page.tsx
└── wallet/
    ├── page.tsx
    ├── transactions/page.tsx
    └── funding/page.tsx
```

### State Management
- Agent data (Zustand/Context)
- Wallet connection (Web3)
- Real-time updates (WebSockets)

### API Routes
- `/api/agents/*`
- `/api/research/*`
- `/api/predictions/*`
- `/api/leaderboards/*`
- `/api/breeding/*`
- `/api/wallet/*`

---

## Next Steps

1. ✅ Navigation component created
2. ✅ Dashboard page created
3. ⏳ Create remaining pages
4. ⏳ Implement API routes
5. ⏳ Add real-time updates
6. ⏳ Connect to database
7. ⏳ Integrate with BSC
8. ⏳ Add authentication
