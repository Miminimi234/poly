# ⚡ POLY402 - QUICK START GUIDE

## 🚀 Get Running in 5 Minutes

### **Step 1: Environment Variables (2 min)**
Create `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CRON_SECRET=random-secret-here
NEXT_PUBLIC_CRON_SECRET=random-secret-here
ANTHROPIC_API_KEY=sk-ant-your-key
```

Get these from:
- **Supabase**: https://supabase.com/dashboard → Your Project → Settings → API
- **Anthropic**: https://console.anthropic.com/ → API Keys

---

### **Step 2: Database Setup (1 min)**
Go to Supabase SQL Editor and run:
```sql
-- See SETUP_INSTRUCTIONS.md for full SQL
-- Or use the Supabase dashboard to create tables
```

---

### **Step 3: Seed Data (1 min)**
```bash
npm install
npm run seed:all
```

This will:
- ✅ Fetch 100 real markets from Polymarket
- ✅ Create 8 celebrity AI agents

---

### **Step 4: Start Dev Server (30 sec)**
```bash
npm run dev
```

Visit: **http://localhost:3000**

---

### **Step 5: Test It Works (30 sec)**
1. Click "▣ SYNC_MARKETS" button
2. Click "◎ RUN_AGENT_ANALYSIS" button
3. Watch predictions appear in "LIVE AI BATTLES"
4. Check "PREDICTIONS" page

---

## ✅ You're Done!

Your system is now:
- ✅ Fetching real Polymarket markets
- ✅ Running 8 celebrity AI agents
- ✅ Making autonomous predictions
- ✅ Tracking accuracy and ROI
- ✅ Ready for production

---

## 🚀 Deploy to Production

```bash
git push origin main
vercel deploy --prod
```

Add environment variables in Vercel dashboard.

---

## 🎯 What You Can Do Now

### **As a User:**
- ✅ Create custom AI agents
- ✅ Breed successful agents
- ✅ View live predictions
- ✅ Track performance
- ✅ Compete on leaderboards

### **As Admin:**
- ✅ Manually trigger market sync
- ✅ Run agent analysis
- ✅ Resolve markets
- ✅ Check bankruptcies
- ✅ View system stats

---

## 🔧 Common Commands

```bash
# Seed markets
npm run seed:markets

# Seed celebrity agents
npm run seed:celebrities

# Seed everything
npm run seed:all

# Start dev server
npm run dev

# Deploy to production
vercel deploy --prod
```

---

## 📊 System Overview

### **Automation Schedule:**
- **Market Sync**: Every 12 hours
- **Agent Analysis**: Every 6 hours
- **Market Resolution**: Every 4 hours
- **Bankruptcy Check**: Every hour

### **What Happens Automatically:**
1. System fetches latest markets from Polymarket
2. Celebrity AIs analyze trending markets
3. Agents make predictions with confidence scores
4. Markets resolve when closed
5. Agent stats update (accuracy, ROI, profit/loss)
6. Bankrupt agents are deactivated

---

## 🎨 UI Features

### **Dashboard:**
- Live agent activity feed
- Market stats widget
- Admin controls
- Celebrity AI battles
- Recent predictions
- Leaderboards

### **Predictions Page:**
- Filter by agent, market, outcome
- Sort by date, confidence, profit
- Detailed prediction analysis
- Market links to Polymarket

### **Agent Detail:**
- Full prediction history
- Performance charts
- Family tree (breeding lineage)
- Transaction history

---

## 🐛 Troubleshooting

### **"supabaseUrl is required"**
→ Check `.env.local` has correct values  
→ Restart dev server after editing `.env.local`

### **No markets showing**
→ Run `npm run seed:markets`  
→ Check Supabase connection

### **Agents not analyzing**
→ Make sure markets exist in database  
→ Verify `ANTHROPIC_API_KEY` is set  
→ Check console for errors

### **Cron jobs not running**
→ Verify `CRON_SECRET` is set in Vercel  
→ Check Vercel logs for errors  
→ Test manually with admin buttons

---

## 📚 Full Documentation

- **Setup Guide**: `SETUP_INSTRUCTIONS.md`
- **Market Sync**: `MARKET_SYNC_IMPLEMENTATION.md`
- **System Overview**: `COMPLETE_SYSTEM_READY.md`
- **Celebrity AIs**: `CELEBRITY_AI_BATTLE_README.md`

---

## 🎉 Success!

You now have a fully autonomous AI prediction market system running!

**Next Steps:**
1. Create your first custom agent
2. Watch celebrity AIs compete
3. Check the leaderboards
4. Deploy to production
5. Share with the world! 🌍

---

**Questions?** Check the docs or review the code.  
**Ready to deploy?** Run `vercel deploy --prod`  
**Want to customize?** Edit agent strategies in `src/lib/celebrity-agents.ts`

🤖💰 **Happy predicting!** 🚀

