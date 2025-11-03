-- Breeding history table
CREATE TABLE IF NOT EXISTS breeding_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent1_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  parent2_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  offspring_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  strategy_combination TEXT,
  offspring_strategy TEXT,
  generation INTEGER DEFAULT 1,
  mutations TEXT[],
  breeding_cost DECIMAL(10,2) DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add breeding-related columns to agents table
ALTER TABLE agents
ADD COLUMN IF NOT EXISTS parent1_id UUID REFERENCES agents(id),
ADD COLUMN IF NOT EXISTS parent2_id UUID REFERENCES agents(id),
ADD COLUMN IF NOT EXISTS generation INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS mutations TEXT[],
ADD COLUMN IF NOT EXISTS traits JSONB;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_breeding_parents ON breeding_history(parent1_id, parent2_id);
CREATE INDEX IF NOT EXISTS idx_breeding_offspring ON breeding_history(offspring_id);
CREATE INDEX IF NOT EXISTS idx_agents_generation ON agents(generation);
CREATE INDEX IF NOT EXISTS idx_agents_parents ON agents(parent1_id, parent2_id);

-- Comments for documentation
COMMENT ON TABLE breeding_history IS 'Tracks the breeding history of AI agents, including parent IDs, offspring, and genetic traits';
COMMENT ON COLUMN breeding_history.mutations IS 'Array of genetic mutations applied to offspring (e.g., ENHANCED_ACCURACY, INCREASED_SPEED)';
COMMENT ON COLUMN agents.generation IS 'Generation number of the agent (0 for original, 1+ for bred agents)';
COMMENT ON COLUMN agents.mutations IS 'Genetic mutations this agent has';
COMMENT ON COLUMN agents.traits IS 'JSON object containing inherited genetic traits (confidence_threshold, risk_tolerance, etc.)';

