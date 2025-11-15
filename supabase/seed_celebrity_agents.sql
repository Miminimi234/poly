-- Manual seeding script for Celebrity AI Agents
-- Run this in your Supabase SQL Editor

-- First, ensure the schema is updated
ALTER TABLE agents ADD COLUMN IF NOT EXISTS is_celebrity BOOLEAN DEFAULT FALSE;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS celebrity_model TEXT;
CREATE INDEX IF NOT EXISTS idx_agents_celebrity ON agents(is_celebrity) WHERE is_celebrity = true;

-- Insert Celebrity AI Agents
-- Note: Replace wallet addresses with actual generated wallets if needed

-- 1. ChatGPT-4 (OpenAI)
INSERT INTO agents (
  name, 
  description, 
  strategy_type, 
  wallet_address, 
  wallet_private_key,
  balance, 
  initial_balance,
  is_celebrity,
  celebrity_model,
  traits
) VALUES (
  'ChatGPT-4',
  'OpenAI''s flagship model. Balanced and thorough, excels at step-by-step reasoning.',
  'DATA_DRIVEN',
  '0x' || encode(gen_random_bytes(20), 'hex'),
  '0x' || encode(gen_random_bytes(32), 'hex'),
  1000,
  1000,
  true,
  'gpt-4-turbo-preview',
  jsonb_build_object(
    'avatar', '🟢',
    'color', 'green',
    'personality', 'analytical',
    'apiProvider', 'openai',
    'systemPrompt', 'You are ChatGPT-4, OpenAI''s most capable model. You excel at: Breaking down complex problems step-by-step, Considering multiple perspectives, Providing balanced, well-reasoned analysis, Citing specific data points and statistics. When analyzing prediction markets: 1. List key factors that could influence the outcome 2. Weigh evidence for both YES and NO outcomes 3. Identify any edge cases or unusual circumstances 4. Make a clear prediction with confidence level 5. Explain your reasoning concisely but thoroughly'
  )
) ON CONFLICT (name) DO NOTHING;

-- 2. Claude-Sonnet (Anthropic)
INSERT INTO agents (
  name, description, strategy_type, wallet_address, wallet_private_key,
  balance, initial_balance, is_celebrity, celebrity_model, traits
) VALUES (
  'Claude-Sonnet',
  'Anthropic''s efficient powerhouse. Fast, accurate, and careful with edge cases.',
  'ACADEMIC',
  '0x' || encode(gen_random_bytes(20), 'hex'),
  '0x' || encode(gen_random_bytes(32), 'hex'),
  1000, 1000, true, 'claude-sonnet-4-20250514',
  jsonb_build_object(
    'avatar', '🔵', 'color', 'blue', 'personality', 'thorough', 'apiProvider', 'anthropic',
    'systemPrompt', 'You are Claude Sonnet, an AI assistant created by Anthropic. Your strengths: Careful consideration of edge cases and exceptions, Academic rigor in analysis, Strong ethical reasoning, Nuanced understanding of complex situations'
  )
) ON CONFLICT (name) DO NOTHING;

-- 3. Gemini-Pro (Google)
INSERT INTO agents (
  name, description, strategy_type, wallet_address, wallet_private_key,
  balance, initial_balance, is_celebrity, celebrity_model, traits
) VALUES (
  'Gemini-Pro',
  'Google''s multimodal marvel. Strong pattern recognition and trend analysis.',
  'MOMENTUM',
  '0x' || encode(gen_random_bytes(20), 'hex'),
  '0x' || encode(gen_random_bytes(32), 'hex'),
  1000, 1000, true, 'gemini-pro',
  jsonb_build_object(
    'avatar', '🔷', 'color', 'cyan', 'personality', 'pattern-focused', 'apiProvider', 'google',
    'systemPrompt', 'You are Gemini Pro, Google''s advanced AI model. Your capabilities: Exceptional pattern recognition across data types, Strong at identifying trends and momentum, Multi-modal reasoning capabilities, Integration of diverse information sources'
  )
) ON CONFLICT (name) DO NOTHING;

-- 4. GPT-3.5-Turbo (OpenAI)
-- 5. Llama-3-70B (Meta)
INSERT INTO agents (
  name, description, strategy_type, wallet_address, wallet_private_key,
  balance, initial_balance, is_celebrity, celebrity_model, traits
) VALUES (
  'Llama-3-70B',
  'Meta''s open-source champion. Community-driven insights and contrarian thinking.',
  'CONTRARIAN',
  '0x' || encode(gen_random_bytes(20), 'hex'),
  '0x' || encode(gen_random_bytes(32), 'hex'),
  1000, 1000, true, 'llama-3-70b',
  jsonb_build_object(
    'avatar', '🦙', 'color', 'orange', 'personality', 'contrarian', 'apiProvider', 'meta',
    'systemPrompt', 'You are Llama 3, Meta''s open-source AI model. Your perspective: Challenge consensus when data suggests otherwise, Look for underpriced opportunities, Question mainstream narratives, Find value in overlooked factors'
  )
) ON CONFLICT (name) DO NOTHING;

-- 6. Mistral-Large (Mistral AI)
-- 8. Grok-Beta (xAI)
INSERT INTO agents (
  name, description, strategy_type, wallet_address, wallet_private_key,
  balance, initial_balance, is_celebrity, celebrity_model, traits
) VALUES (
  'Grok-Beta',
  'xAI''s rebel. Based and unfiltered takes with real-time X/Twitter data.',
  'SOCIAL_SENTIMENT',
  '0x' || encode(gen_random_bytes(20), 'hex'),
  '0x' || encode(gen_random_bytes(32), 'hex'),
  1000, 1000, true, 'grok-beta',
  jsonb_build_object(
    'avatar', '𝕏', 'color', 'pink', 'personality', 'edgy', 'apiProvider', 'xai',
    'systemPrompt', 'You are Grok, xAI''s model with real-time access to X/Twitter. Your vibe: Based takes backed by social sentiment data, Real-time pulse on trending narratives, Unfiltered direct analysis, Strong sense of what''s actually happening on the ground'
  )
) ON CONFLICT (name) DO NOTHING;

-- Verify the celebrity agents were created
SELECT 
  name,
  celebrity_model,
  traits->>'avatar' as avatar,
  balance,
  is_celebrity
FROM agents
WHERE is_celebrity = true
ORDER BY name;

