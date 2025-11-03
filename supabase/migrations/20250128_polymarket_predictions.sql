-- Store Polymarket markets we're tracking
CREATE TABLE IF NOT EXISTS polymarket_markets (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  description TEXT,
  yes_price DECIMAL(5,4),
  no_price DECIMAL(5,4),
  volume DECIMAL(15,2),
  liquidity DECIMAL(15,2),
  end_date TIMESTAMP,
  market_slug TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  outcome TEXT,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Store agent predictions on markets
CREATE TABLE IF NOT EXISTS agent_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  market_id TEXT REFERENCES polymarket_markets(id),
  prediction TEXT CHECK (prediction IN ('YES', 'NO')),
  confidence DECIMAL(5,4) CHECK (confidence >= 0 AND confidence <= 1),
  reasoning TEXT,
  price_at_prediction DECIMAL(5,4),
  research_cost DECIMAL(10,6),
  research_sources TEXT[], -- Array of sources used
  outcome TEXT,
  correct BOOLEAN,
  profit_loss DECIMAL(15,6),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_predictions_agent ON agent_predictions(agent_id);
CREATE INDEX IF NOT EXISTS idx_predictions_market ON agent_predictions(market_id);
CREATE INDEX IF NOT EXISTS idx_predictions_created ON agent_predictions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_markets_active ON polymarket_markets(resolved, end_date) WHERE resolved = FALSE;

-- Function to increment agent prediction count
CREATE OR REPLACE FUNCTION increment_agent_predictions(agent_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE agents 
  SET total_predictions = total_predictions + 1
  WHERE id = agent_id;
END;
$$ LANGUAGE plpgsql;

