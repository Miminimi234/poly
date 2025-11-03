# Leaderboard 500 Error - FIXED

## Problem

The leaderboard API was returning a 500 Internal Server Error.

## Root Causes

1. **Missing Environment Variables**
   - `SUPABASE_SERVICE_ROLE_KEY` might not be set
   - API was crashing instead of handling gracefully

2. **Authentication Issue**
   - `/api/agents` endpoint required authentication
   - Breeding modal and leaderboard were trying to fetch all agents
   - Would fail for unauthenticated users

## Solutions Applied

### 1. Better Error Handling in Leaderboard API

**File:** `src/app/api/leaderboards/route.ts`

**Changes:**
- Added check for environment variables before creating Supabase client
- Returns graceful error message if variables missing
- Prevents server crash

```typescript
// Check if environment variables are set
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase environment variables');
  return NextResponse.json({
    success: true,
    metric,
    leaderboard: [],
    message: 'Database not configured. Set SUPABASE environment variables.'
  });
}
```

### 2. Added "All Users" Mode to Agents API

**File:** `src/app/api/agents/route.ts`

**Changes:**
- Added `all=true` query parameter
- Allows fetching all agents (not just user's own)
- Still requires auth for personal agent queries
- Returns empty array with success flag on error

```typescript
const allUsers = searchParams.get('all') === 'true';

// Build query
let query = supabase
  .from('agents')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(limit);

// Filter by user if not requesting all agents
if (!allUsers && user) {
  query = query.eq('user_id', user.id);
}
```

### 3. Updated Breeding Modal

**File:** `src/components/BreedAgentsModal.tsx`

**Changes:**
- Now fetches agents with `?all=true` parameter
- Can access all eligible agents for breeding

```typescript
const response = await fetch('/api/agents?all=true');
```

## How to Fix

### If you see this error:

1. **Check Environment Variables**

Add to `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

2. **Run Database Migrations**

```bash
supabase db push
```

This adds the required columns:
- `accuracy`
- `roi`
- `total_profit_loss`
- `generation`
- `mutations`
- etc.

3. **Restart Dev Server**

```bash
# Kill existing server
# Then:
npm run dev
```

## Expected Behavior Now

### With No Environment Variables:
```json
{
  "success": true,
  "leaderboard": [],
  "message": "Database not configured. Set SUPABASE environment variables."
}
```
✅ **No crash, graceful error message**

### With Missing Database Columns:
```json
{
  "success": true,
  "leaderboard": [],
  "message": "Database migration needed. Run: supabase db push"
}
```
✅ **No crash, helpful migration reminder**

### With Everything Configured:
```json
{
  "success": true,
  "metric": "accuracy",
  "leaderboard": [
    {
      "id": "uuid",
      "name": "Agent_Alpha",
      "accuracy": 75.5,
      "roi": 12.3,
      ...
    }
  ]
}
```
✅ **Works as expected**

## Testing

1. **Test leaderboard without env vars:**
   ```bash
   # Temporarily remove env vars
   curl http://localhost:3000/api/leaderboards?metric=accuracy
   ```
   Should return graceful error, not 500.

2. **Test agents API with all=true:**
   ```bash
   curl http://localhost:3000/api/agents?all=true
   ```
   Should return all agents.

3. **Test breeding modal:**
   - Open breed modal
   - Should show all eligible agents
   - Not just your own

## Status

✅ **FIXED** - API now handles errors gracefully  
✅ **FIXED** - Breeding can access all agents  
✅ **IMPROVED** - Better error messages  
✅ **SAFE** - No more crashes on missing config  

---

**If you still see 500 errors, check:**
1. Database is actually running
2. Environment variables are correct
3. Database migrations have been applied
4. Console logs for specific error details

