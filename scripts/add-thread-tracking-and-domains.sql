-- Add thread_id to processed_emails for tracking email threads
ALTER TABLE processed_emails 
ADD COLUMN IF NOT EXISTS thread_id TEXT;

-- Create index for faster thread lookups
CREATE INDEX IF NOT EXISTS idx_processed_emails_thread_id 
ON processed_emails(user_id, thread_id);

-- Create vip_domains table for domain allowlisting
CREATE TABLE IF NOT EXISTS vip_domains (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint to prevent duplicate domains per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_vip_domains_user_domain 
ON vip_domains(user_id, domain);

-- Enable RLS on vip_domains
ALTER TABLE vip_domains ENABLE ROW LEVEL SECURITY;

-- RLS policies for vip_domains
CREATE POLICY "Users can view their own domains" ON vip_domains
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own domains" ON vip_domains
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own domains" ON vip_domains
  FOR DELETE USING (auth.uid() = user_id);

-- Add suspicious_activity_flags table for admin alerts
CREATE TABLE IF NOT EXISTS suspicious_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  description TEXT,
  metadata JSONB,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for admin queries
CREATE INDEX IF NOT EXISTS idx_suspicious_activity_resolved 
ON suspicious_activity(resolved, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_suspicious_activity_user 
ON suspicious_activity(user_id, created_at DESC);
