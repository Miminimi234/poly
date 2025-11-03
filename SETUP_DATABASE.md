# Database Setup for Accuracy Tracking

## The Error You're Seeing

```
The string did not match the expected pattern.
```

This means the database columns for accuracy tracking don't exist yet!

---

## Quick Fix - Run Database Migration

### Option 1: Using Supabase CLI (Recommended)

```bash
# Run the migration
supabase db push
```

This will apply the SQL file: `supabase/migrations/add_accuracy_tracking.sql`

### Option 2: Manual SQL Execution

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Copy and paste this SQL:

```sql
-- Add accuracy tracking columns to agents table
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS accuracy DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_profit_loss DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS roi DECIMAL(10,2) DEFAULT 0;

-- Create indexes for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_agents_accuracy ON agents(accuracy DESC);
CREATE INDEX IF NOT EXISTS idx_agents_roi ON agents(roi DESC);
CREATE INDEX IF NOT EXISTS idx_agents_profit ON agents(total_profit_loss DESC);

-- Add outcome tracking columns to agent_predictions table
ALTER TABLE agent_predictions
ADD COLUMN IF NOT EXISTS outcome VARCHAR(10),
ADD COLUMN IF NOT EXISTS correct BOOLEAN,
ADD COLUMN IF NOT EXISTS profit_loss DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- Create indexes for prediction queries
CREATE INDEX IF NOT EXISTS idx_predictions_agent_resolved 
  ON agent_predictions(agent_id, correct) 
  WHERE correct IS NOT NULL;
  
CREATE INDEX IF NOT EXISTS idx_predictions_market_unresolved 
  ON agent_predictions(market_id) 
  WHERE outcome IS NULL;

-- Add outcome column to polymarket_markets table
ALTER TABLE polymarket_markets
ADD COLUMN IF NOT EXISTS outcome VARCHAR(10);

-- Create index for unresolved markets
CREATE INDEX IF NOT EXISTS idx_markets_unresolved 
  ON polymarket_markets(resolved) 
  WHERE resolved = false;
```

5. Click **Run** or press `Cmd/Ctrl + Enter`

---

## Verify It Worked

### Check the Leaderboard Component

After running the migration, the error should disappear and you should see:

✅ **If no predictions yet:** "NO RESOLVED PREDICTIONS YET. AGENTS NEED TO WAIT FOR MARKETS TO RESOLVE!"

✅ **If predictions exist:** Leaderboard with agent rankings

### Check in Browser Console

Should show:
```
Leaderboard API returned successfully
```

Instead of:
```
The string did not match the expected pattern
```

---

## What These Columns Do

### `agents` table:
- `accuracy` - % of correct predictions (e.g., 75.50 = 75.5%)
- `total_profit_loss` - Total profit or loss in dollars
- `roi` - Return on investment percentage

### `agent_predictions` table:
- `outcome` - Actual market result ('YES' or 'NO')
- `correct` - Whether prediction matched outcome
- `profit_loss` - Money made/lost on this prediction
- `resolved_at` - Timestamp when resolved

### `polymarket_markets` table:
- `outcome` - Market resolution ('YES' or 'NO')

---

## Next Steps After Migration

1. ✅ Database columns added
2. Create agents at `/agents/create`
3. Trigger analysis on dashboard
4. Wait for markets to resolve
5. Click "CHECK_RESOLUTIONS_NOW" button
6. View leaderboard!

---

## Troubleshooting

### Still getting errors?

**Check environment variables:**
```bash
NEXT_PUBLIC_SUPABASE_URL=your-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Check Supabase connection:**
```bash
supabase status
```

**Check browser console:**
Press `F12` and look for detailed error messages

---

## Need Help?

The leaderboard component now has better error messages. Look for the warning box that shows:
- API errors
- Empty responses
- Database migration reminders

The system will gracefully handle missing columns and show a helpful message!

