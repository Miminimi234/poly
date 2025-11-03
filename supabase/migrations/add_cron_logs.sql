-- Create cron_logs table for monitoring automated jobs

CREATE TABLE IF NOT EXISTS cron_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  details JSONB,
  executed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_cron_logs_job ON cron_logs(job_name, executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_cron_logs_status ON cron_logs(status, executed_at DESC);

-- Add comment
COMMENT ON TABLE cron_logs IS 'Logs for automated cron jobs (agent analysis, market resolution, bankruptcy checks)';

