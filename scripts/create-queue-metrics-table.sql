-- Create queue_metrics table to track call queue performance
CREATE TABLE IF NOT EXISTS queue_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cron_run_at TIMESTAMP WITH TIME ZONE NOT NULL,
  total_calls_queued INTEGER NOT NULL DEFAULT 0,
  total_processing_time_ms INTEGER NOT NULL DEFAULT 0,
  longest_wait_time_ms INTEGER NOT NULL DEFAULT 0,
  average_wait_time_ms INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for querying recent metrics
CREATE INDEX IF NOT EXISTS idx_queue_metrics_created_at ON queue_metrics(created_at DESC);

-- Keep only last 7 days of metrics (optional cleanup)
-- You can run this periodically to clean old data
