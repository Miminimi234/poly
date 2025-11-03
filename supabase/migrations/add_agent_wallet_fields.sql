-- Add wallet and balance columns to agents table
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS wallet_address TEXT,
ADD COLUMN IF NOT EXISTS wallet_private_key_encrypted TEXT,
ADD COLUMN IF NOT EXISTS initial_balance_usdt DECIMAL(15,2) DEFAULT 0;

-- Rename balance columns if needed for consistency
-- current_balance_usdt should already exist
-- total_spent_usdt should already exist  
-- total_earned_usdt should already exist

-- Create index for active agents queries
CREATE INDEX IF NOT EXISTS idx_agents_active_status ON agents(is_active, is_bankrupt);

-- Create index for wallet lookups
CREATE INDEX IF NOT EXISTS idx_agents_wallet ON agents(wallet_address);

