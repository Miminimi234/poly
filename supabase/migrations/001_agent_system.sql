-- Agent System Database Schema
-- Extends existing database with agent management, monitoring, and competition features

-- AGENTS TABLE
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  strategy_type VARCHAR(50) NOT NULL,
  
  wallet_address VARCHAR(255) NOT NULL UNIQUE,
  wallet_private_key_encrypted TEXT NOT NULL,
  
  initial_balance_usdt NUMERIC(18, 6) NOT NULL DEFAULT 0,
  current_balance_usdt NUMERIC(18, 6) NOT NULL DEFAULT 0,
  total_spent_usdt NUMERIC(18, 6) NOT NULL DEFAULT 0,
  total_earned_usdt NUMERIC(18, 6) NOT NULL DEFAULT 0,
  net_profit_usdt NUMERIC(18, 6) NOT NULL DEFAULT 0,
  
  total_predictions INTEGER NOT NULL DEFAULT 0,
  correct_predictions INTEGER NOT NULL DEFAULT 0,
  accuracy NUMERIC(5, 4) NOT NULL DEFAULT 0,
  roi NUMERIC(10, 6) NOT NULL DEFAULT 0,
  
  research_purchases_count INTEGER NOT NULL DEFAULT 0,
  avg_research_cost_usdt NUMERIC(10, 6) NOT NULL DEFAULT 0,
  
  strategy_config JSONB NOT NULL DEFAULT '{}',
  
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_bankrupt BOOLEAN NOT NULL DEFAULT false,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_agents_performance ON agents(accuracy DESC, roi DESC);

-- AGENT RESEARCH SESSIONS TABLE
CREATE TABLE IF NOT EXISTS agent_research_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  
  session_type VARCHAR(50) NOT NULL,
  market_url TEXT,
  market_question TEXT,
  
  research_resources JSONB NOT NULL DEFAULT '[]',
  forecast_probability NUMERIC(5, 4),
  forecast_confidence NUMERIC(5, 4),
  total_research_cost_usdt NUMERIC(10, 6) NOT NULL DEFAULT 0,
  research_decisions JSONB NOT NULL DEFAULT '[]',
  
  outcome_correct BOOLEAN,
  outcome_resolved_at TIMESTAMP WITH TIME ZONE,
  earnings_usdt NUMERIC(10, 6) DEFAULT 0,
  
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_research_sessions_agent_id ON agent_research_sessions(agent_id);
CREATE INDEX idx_research_sessions_started_at ON agent_research_sessions(started_at DESC);

-- AGENT TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS agent_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  
  transaction_type VARCHAR(50) NOT NULL,
  transaction_hash VARCHAR(255),
  amount_usdt NUMERIC(10, 6) NOT NULL,
  
  resource_id VARCHAR(255),
  resource_type VARCHAR(50),
  research_session_id UUID REFERENCES agent_research_sessions(id),
  
  description TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_agent_id ON agent_transactions(agent_id);
CREATE INDEX idx_transactions_created_at ON agent_transactions(created_at DESC);

-- AGENT RESEARCH DECISIONS TABLE
CREATE TABLE IF NOT EXISTS agent_research_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  research_session_id UUID REFERENCES agent_research_sessions(id) ON DELETE CASCADE,
  
  resource_id VARCHAR(255) NOT NULL,
  resource_name VARCHAR(255) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  price_usdt NUMERIC(10, 6) NOT NULL,
  
  reasoning TEXT,
  expected_value NUMERIC(10, 6),
  strategy_considerations JSONB DEFAULT '{}',
  
  purchase_successful BOOLEAN NOT NULL DEFAULT false,
  research_data_received JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_research_decisions_agent_id ON agent_research_decisions(agent_id);

-- AGENT COMPETITIONS TABLE
CREATE TABLE IF NOT EXISTS agent_competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  competition_type VARCHAR(50) NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  scoring_metrics JSONB NOT NULL DEFAULT '{}',
  prize_pool_usdt NUMERIC(18, 6) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_competitions_active ON agent_competitions(is_active);

-- AGENT COMPETITION ENTRIES TABLE
CREATE TABLE IF NOT EXISTS agent_competition_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES agent_competitions(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  
  entry_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  score NUMERIC(10, 6) NOT NULL DEFAULT 0,
  rank INTEGER,
  prize_won_usdt NUMERIC(10, 6) DEFAULT 0,
  
  predictions_made INTEGER NOT NULL DEFAULT 0,
  correct_predictions INTEGER NOT NULL DEFAULT 0,
  accuracy NUMERIC(5, 4) DEFAULT 0,
  total_profit_usdt NUMERIC(18, 6) DEFAULT 0,
  
  UNIQUE(competition_id, agent_id)
);

CREATE INDEX idx_competition_entries_competition_id ON agent_competition_entries(competition_id);
CREATE INDEX idx_competition_entries_score ON agent_competition_entries(score DESC);

-- AGENT MARKET ANALYSIS TABLE
CREATE TABLE IF NOT EXISTS agent_market_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  research_session_id UUID REFERENCES agent_research_sessions(id) ON DELETE CASCADE,
  
  market_url TEXT NOT NULL,
  market_question TEXT NOT NULL,
  market_platform VARCHAR(50),
  
  forecast_probability NUMERIC(5, 4) NOT NULL,
  forecast_confidence NUMERIC(5, 4) NOT NULL,
  market_probability NUMERIC(5, 4),
  
  research_count INTEGER NOT NULL DEFAULT 0,
  research_cost_usdt NUMERIC(10, 6) NOT NULL DEFAULT 0,
  evidence_items JSONB DEFAULT '[]',
  
  key_drivers JSONB DEFAULT '[]',
  top_influences JSONB DEFAULT '[]',
  
  analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_market_analysis_agent_id ON agent_market_analysis(agent_id);
