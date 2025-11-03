-- Add accuracy tracking columns to agents table
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS accuracy DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_profit_loss DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS roi DECIMAL(10,2) DEFAULT 0;

-- Create indexes for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_agents_accuracy ON agents(accuracy DESC);
CREATE INDEX IF NOT EXISTS idx_agents_roi ON agents(roi DESC);
CREATE INDEX IF NOT EXISTS idx_agents_profit ON agents(total_profit_loss DESC);

-- Add outcome tracking columns to agent_predictions table if not exists
ALTER TABLE agent_predictions
ADD COLUMN IF NOT EXISTS outcome VARCHAR(10),
ADD COLUMN IF NOT EXISTS correct BOOLEAN,
ADD COLUMN IF NOT EXISTS profit_loss DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- Create index for prediction resolution queries
CREATE INDEX IF NOT EXISTS idx_predictions_agent_resolved ON agent_predictions(agent_id, correct) WHERE correct IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_predictions_market_unresolved ON agent_predictions(market_id) WHERE outcome IS NULL;

-- Add outcome column to polymarket_markets table if not exists
ALTER TABLE polymarket_markets
ADD COLUMN IF NOT EXISTS outcome VARCHAR(10);

-- Create index for unresolved markets
CREATE INDEX IF NOT EXISTS idx_markets_unresolved ON polymarket_markets(resolved) WHERE resolved = false;

