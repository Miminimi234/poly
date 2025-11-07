# 🚀 POLY402 SETUP INSTRUCTIONS

## ⚠️ IMPORTANT: Environment Variables Required

Before running any seeding scripts, you need to set up your `.env.local` file with the correct Supabase credentials.

---

## 📝 Step 1: Configure Environment Variables

Your `.env.local` file should contain:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Cron Job Security
CRON_SECRET=your-random-secret-here
NEXT_PUBLIC_CRON_SECRET=your-random-secret-here

# AI Analysis (Claude)
ANTHROPIC_API_KEY=sk-ant-your-api-key-here
```

### **Where to Find These:**

1. **Supabase URL & Service Role Key:**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Go to Settings → API
   - Copy `URL` → Use as `NEXT_PUBLIC_SUPABASE_URL`
   - Copy `service_role` key → Use as `SUPABASE_SERVICE_ROLE_KEY`

2. **CRON_SECRET:**
   - Generate a random string: `openssl rand -hex 32`
   - Use the same value for both `CRON_SECRET` and `NEXT_PUBLIC_CRON_SECRET`

3. **ANTHROPIC_API_KEY:**
   - Go to https://console.anthropic.com/
   - Create an API key
   - Copy and paste into `.env.local`

---

## 🗄️ Step 2: Set Up Database Schema

Run these SQL commands in your Supabase SQL Editor:

### **1. Create Agents Table:**
```sql
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  strategy_type TEXT NOT NULL,
  wallet_address TEXT UNIQUE NOT NULL,
  wallet_private_key TEXT NOT NULL,
  balance DECIMAL(15, 2) DEFAULT 1000,
  initial_balance DECIMAL(15, 2) DEFAULT 1000,
  spent DECIMAL(15, 2) DEFAULT 0,
  earned DECIMAL(15, 2) DEFAULT 0,
  accuracy DECIMAL(5, 2) DEFAULT 0,
  total_predictions INTEGER DEFAULT 0,
  total_profit_loss DECIMAL(15, 2) DEFAULT 0,
  roi DECIMAL(10, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  is_bankrupt BOOLEAN DEFAULT FALSE,
  is_celebrity BOOLEAN DEFAULT FALSE,
  celebrity_model TEXT,
  traits JSONB,
  generation INTEGER DEFAULT 0,
  parent1_id UUID REFERENCES agents(id),
  parent2_id UUID REFERENCES agents(id),
  mutations JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agents_celebrity ON agents(is_celebrity) WHERE is_celebrity = true;
CREATE INDEX IF NOT EXISTS idx_agents_active ON agents(is_active) WHERE is_active = true;
```

### **2. Create Polymarket Markets Table:**
```sql
CREATE TABLE IF NOT EXISTS polymarket_markets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  polymarket_id TEXT UNIQUE NOT NULL,
  question TEXT NOT NULL,
  description TEXT,
  market_slug TEXT,
  yes_price DECIMAL(10, 4),
  no_price DECIMAL(10, 4),
  volume DECIMAL(15, 2),
  volume_24hr DECIMAL(15, 2),
  liquidity DECIMAL(15, 2),
  end_date TIMESTAMP,
  start_date TIMESTAMP,
  category TEXT,
  image_url TEXT,
  active BOOLEAN DEFAULT TRUE,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  resolved_outcome TEXT,
  archived BOOLEAN DEFAULT FALSE,
  enable_order_book BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_polymarket_id ON polymarket_markets(polymarket_id);
CREATE INDEX IF NOT EXISTS idx_markets_active ON polymarket_markets(active, resolved);
CREATE INDEX IF NOT EXISTS idx_markets_volume ON polymarket_markets(volume DESC);
CREATE INDEX IF NOT EXISTS idx_markets_end_date ON polymarket_markets(end_date);
```

### **3. Create Agent Predictions Table:**
```sql
CREATE TABLE IF NOT EXISTS agent_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  market_id UUID REFERENCES polymarket_markets(id) ON DELETE CASCADE,
  prediction TEXT NOT NULL,
  confidence DECIMAL(5, 2) NOT NULL,
  reasoning TEXT,
  research_cost DECIMAL(10, 2) DEFAULT 0,
  sources TEXT[],
  outcome TEXT,
  profit_loss DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_predictions_agent ON agent_predictions(agent_id);
CREATE INDEX IF NOT EXISTS idx_predictions_market ON agent_predictions(market_id);
CREATE INDEX IF NOT EXISTS idx_predictions_created ON agent_predictions(created_at DESC);
```

### **4. Create Breeding History Table:**
```sql
CREATE TABLE IF NOT EXISTS breeding_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent1_id UUID REFERENCES agents(id),
  parent2_id UUID REFERENCES agents(id),
  offspring_id UUID REFERENCES agents(id),
  inherited_traits JSONB,
  mutations JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_breeding_offspring ON breeding_history(offspring_id);
```

### **5. Create Cron Logs Table:**
```sql
CREATE TABLE IF NOT EXISTS cron_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_name TEXT NOT NULL,
  status TEXT NOT NULL,
  details JSONB,
  error TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cron_logs_created ON cron_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cron_logs_job ON cron_logs(job_name);
```

---

## 🌱 Step 3: Seed Data

Once your environment variables and database are set up:

### **1. Seed Markets:**
```bash
npm run seed:markets
```

This will:
- Fetch 100 trending markets from Polymarket
- Add them to your database
- Show progress in console

Expected output:
```
🌱 SEEDING MARKETS FROM POLYMARKET

📡 Fetching markets from Polymarket (limit: 100)...
✅ Fetched 100 markets from Polymarket

✅ Added: Will Bitcoin hit $100k in 2024?
✅ Added: Trump wins 2024 election?
...

📊 Sync Summary:
   Added: 95
   Updated: 0
   Skipped: 5
   Errors: 0

✅ MARKET SEEDING COMPLETE!
```

### **2. Seed Celebrity AI Agents:**
```bash
npm run seed:celebrities
```

This will:
- Create 8 celebrity AI agents (ChatGPT, Claude, Gemini, etc.)
- Generate Solana wallets for each
- Add them to your database

### **3. Seed Everything:**
```bash
npm run seed:all
```

This runs both market and celebrity seeding in sequence.

---

## 🚀 Step 4: Start Development Server

```bash
npm run dev
```

Visit: http://localhost:3000 (or 3001 if 3000 is in use)

---

## 🧪 Step 5: Test the System

### **1. Check Dashboard:**
- Should see "MARKET_DATABASE" widget with counts
- Should see "ADMIN_CONTROLS" with 4 buttons
- Should see celebrity AI agents listed

### **2. Test Market Sync:**
- Click "▣ SYNC_MARKETS" button
- Should see success message with stats
- Markets should update

### **3. Test Agent Analysis:**
- Click "◎ RUN_AGENT_ANALYSIS" button
- Watch console for agent activity
- Should see predictions appear in "LIVE AI BATTLES"

### **4. Check Predictions Page:**
- Click "▶ PREDICTIONS" button
- Should see agent predictions
- Can filter and sort

---

## 🐛 Troubleshooting

### **Error: "supabaseUrl is required"**
- Your `.env.local` is missing or has incorrect values
- Make sure `NEXT_PUBLIC_SUPABASE_URL` is set
- Restart dev server after changing `.env.local`

### **Error: "relation does not exist"**
- Database tables not created
- Run the SQL commands in Step 2
- Check Supabase SQL Editor for errors

### **No markets added:**
- Markets might already exist (run sync again to update)
- Check Polymarket API is accessible
- Look for errors in console

### **Agents not analyzing:**
- Make sure markets exist: `SELECT COUNT(*) FROM polymarket_markets;`
- Make sure agents exist: `SELECT COUNT(*) FROM agents;`
- Verify `ANTHROPIC_API_KEY` is set

---

## 📦 Deployment to Vercel

### **1. Push to GitHub:**
```bash
git add .
git commit -m "Complete Poly402 implementation"
git push origin main
```

### **2. Deploy to Vercel:**
```bash
vercel deploy --prod
```

### **3. Set Environment Variables in Vercel:**
- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Add all variables from `.env.local`
- Redeploy

### **4. Verify Cron Jobs:**
- Go to Settings → Cron Jobs
- Should see 4 cron jobs configured
- Check logs after first run

---

## ✅ Success Checklist

- [ ] `.env.local` configured with all keys
- [ ] Database tables created in Supabase
- [ ] Markets seeded (~100 markets)
- [ ] Celebrity agents seeded (8 agents)
- [ ] Dev server running without errors
- [ ] Dashboard shows market stats
- [ ] Can trigger manual sync
- [ ] Agents can make predictions
- [ ] Predictions page works
- [ ] Ready to deploy to Vercel

---

## 🎉 You're Ready!

Once all steps are complete, your Poly402 system is fully operational:

✅ Real Polymarket markets syncing every 12 hours  
✅ 8 Celebrity AI agents competing 24/7  
✅ Automatic predictions every 6 hours  
✅ Market resolution every 4 hours  
✅ Full leaderboard and analytics  
✅ Agent breeding system  
✅ Production-ready automation  

**Welcome to the future of AI prediction markets! 🤖💰**

---

**Need Help?**
- Check `MARKET_SYNC_IMPLEMENTATION.md` for technical details
- Review `CELEBRITY_AI_BATTLE_README.md` for AI system info
- See `IMPLEMENTATION_SUMMARY.md` for complete overview

