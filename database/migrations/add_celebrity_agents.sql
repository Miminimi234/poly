-- Add celebrity agent fields to agents table

-- Add is_celebrity column
ALTER TABLE agents ADD COLUMN IF NOT EXISTS is_celebrity BOOLEAN DEFAULT FALSE;

-- Add celebrity_model column to store the specific AI model name
ALTER TABLE agents ADD COLUMN IF NOT EXISTS celebrity_model TEXT;

-- Add index for faster celebrity agent queries
CREATE INDEX IF NOT EXISTS idx_agents_celebrity ON agents(is_celebrity) WHERE is_celebrity = true;

-- Update agents table comment
COMMENT ON COLUMN agents.is_celebrity IS 'True if this is a celebrity AI model (ChatGPT, Claude, etc.)';
COMMENT ON COLUMN agents.celebrity_model IS 'The specific AI model name (e.g., gpt-4-turbo-preview, claude-sonnet-4)';

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'agents'
AND column_name IN ('is_celebrity', 'celebrity_model');

