-- Add celebrity agent fields to agents table

-- Add is_celebrity column (if not exists)
ALTER TABLE agents ADD COLUMN IF NOT EXISTS is_celebrity BOOLEAN DEFAULT FALSE;

-- Add celebrity_model column to store the specific AI model name
ALTER TABLE agents ADD COLUMN IF NOT EXISTS celebrity_model TEXT;

-- Add index for faster celebrity agent queries
CREATE INDEX IF NOT EXISTS idx_agents_celebrity ON agents(is_celebrity) WHERE is_celebrity = true;

-- Update agents table comments
COMMENT ON COLUMN agents.is_celebrity IS 'True if this is a celebrity AI model (ChatGPT, Claude, etc.)';
COMMENT ON COLUMN agents.celebrity_model IS 'The specific AI model name (e.g., gpt-4-turbo-preview, claude-sonnet-4)';

