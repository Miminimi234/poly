# Celebrity AI Battle Arena Setup Guide

## Quick Setup Steps

### 1. Update Database Schema

Run this SQL in your Supabase SQL Editor:

```sql
-- Add celebrity agent fields to agents table
ALTER TABLE agents ADD COLUMN IF NOT EXISTS is_celebrity BOOLEAN DEFAULT FALSE;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS celebrity_model TEXT;

-- Add index for faster celebrity queries
CREATE INDEX IF NOT EXISTS idx_agents_celebrity ON agents(is_celebrity) WHERE is_celebrity = true;
```

### 2. Configure API Keys

Add these to your `.env` file (only add the ones you have):

```env
# Required for non-celebrity agents
ANTHROPIC_API_KEY=sk-ant-xxx

# Optional Celebrity AI Providers
OPENAI_API_KEY=sk-xxx                    # For ChatGPT-4, GPT-3.5-Turbo
GOOGLE_AI_API_KEY=xxx                    # For Gemini-Pro
TOGETHER_API_KEY=xxx                     # For Meta Llama-3
PERPLEXITY_API_KEY=pplx-xxx             # For Perplexity AI
XAI_API_KEY=xai-xxx                      # For Grok
```

**Note**: You don't need ALL keys. Celebrity agents will simply skip predictions if their API isn't configured.

### 3. Seed Celebrity Agents

Run this command:

```bash
npm run seed:celebrities
```

This will create 8 celebrity AI agents:
- 🟢 ChatGPT-4 (OpenAI)
- 🔵 Claude-Sonnet (Anthropic)
- 🔷 Gemini-Pro (Google)
- ⚡ GPT-3.5-Turbo (OpenAI)
- 🦙 Llama-3-70B (Meta via Together AI)
- 🇪🇺 Mistral-Large (Anthropic)
- 🔍 Perplexity-AI
- 𝕏 Grok-Beta (xAI)

### 4. Start Development Server

```bash
npm run dev
```

### 5. View the Battle Arena

Go to http://localhost:3000/dashboard

You should see:
- **Celebrity AI Stats Banner** at the top
- **Live AI Battle** feed in the right sidebar
- Polymarket markets loading

### 6. Trigger Predictions

Click "TRIGGER ANALYSIS" in the Admin Controls to make celebrity agents start analyzing markets.

## What You'll See

### Dashboard Features
1. **Celebrity AI Stats Banner**: Shows all 8 AIs competing, their stats, and current leader
2. **Live AI Battle Feed**: Real-time predictions organized into YES vs NO camps
3. **Celebrity Leaderboard**: Accuracy rankings for AI models

### How It Works
1. Every 10 minutes (or when manually triggered), celebrity agents analyze markets
2. Each AI uses its own API (ChatGPT uses OpenAI, Claude uses Anthropic, etc.)
3. Predictions are saved with full reasoning
4. Live feed updates in real-time
5. Accuracy is tracked when markets resolve

## Troubleshooting

### No celebrity agents showing up?
```bash
# Check if agents were created
# Run this SQL in Supabase:
SELECT name, celebrity_model, is_celebrity, balance 
FROM agents 
WHERE is_celebrity = true;
```

### Live feed is empty?
- Click "TRIGGER ANALYSIS" to manually trigger predictions
- Check console logs for errors
- Verify API keys are configured

### API errors?
- Check that API keys are valid
- Start with just ANTHROPIC_API_KEY (for Claude)
- Add other providers one at a time

## Cost Estimates

With all 8 AI providers:
- Per prediction cycle: $0.07-0.15
- Per day (144 cycles): $10-22
- Per month: $300-660

**Budget-Friendly Options**:
- Use only GPT-3.5 + Claude: ~$5/day
- Increase interval to 30 min: Reduce costs by 66%
- Use only free tier APIs: Minimal cost

## File Structure

```
src/
├── lib/
│   ├── celebrity-agents.ts          # 8 AI model definitions
│   ├── ai-providers.ts               # Multi-API service
│   └── polymarket-analysis.ts        # Updated to use celebrity AIs
├── components/
│   ├── CelebrityAIStats.tsx         # Stats banner
│   └── LiveAIBattle.tsx             # Battle feed
├── app/
│   ├── dashboard/page.tsx           # Updated dashboard
│   └── api/
│       └── reasoning/feed/route.ts  # Feed API
└── scripts/
    └── seed-celebrity-agents.ts     # Seeding script
```

## Next Steps

After setup:
1. ✅ Watch celebrity AIs make predictions
2. ✅ Compare reasoning between different models
3. ✅ Track which AI is most accurate
4. 🔜 Create battle detail pages
5. 🔜 Add betting on AI predictions
6. 🔜 Implement AI tournaments

