-- Create call_costs table to track Twilio costs per call
CREATE TABLE IF NOT EXISTS call_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  call_sid TEXT NOT NULL,
  call_duration INTEGER NOT NULL, -- in seconds
  amd_used BOOLEAN NOT NULL DEFAULT false,
  estimated_cost DECIMAL(10, 4) NOT NULL, -- calculated cost in USD
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast user cost lookups
CREATE INDEX IF NOT EXISTS idx_call_costs_user_id ON call_costs(user_id);
CREATE INDEX IF NOT EXISTS idx_call_costs_created_at ON call_costs(created_at);
