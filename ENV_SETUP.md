# 🔐 ENVIRONMENT VARIABLES SETUP

## Required Environment Variables

Create a `.env.local` file in the root directory with these variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Anthropic API (for AI predictions)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Cron Secret (for Vercel cron jobs)
CRON_SECRET=your_random_secret_here

#  Protocol
_ENABLED=true

# Solana Configuration (optional - defaults to testnet)
BSC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
BSC_CHAIN_ID=97

# Application URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## How to Get API Keys

### Supabase
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Project Settings > API
4. Copy the URL and keys

### Anthropic
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an account
3. Get your API key from the dashboard

### Cron Secret
Generate a random secret:
```bash
openssl rand -base64 32
```

## Production Deployment

For Vercel deployment, add these as environment variables in your project settings.

