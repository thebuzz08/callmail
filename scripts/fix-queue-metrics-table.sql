-- Fix queue_metrics table to match API expectations
-- Drop and recreate with correct columns

DROP TABLE IF EXISTS queue_metrics;

CREATE TABLE queue_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  users_checked INTEGER NOT NULL DEFAULT 0,
  calls_triggered INTEGER NOT NULL DEFAULT 0,
  processing_time_ms INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries by date
CREATE INDEX idx_queue_metrics_created_at ON queue_metrics(created_at DESC);
