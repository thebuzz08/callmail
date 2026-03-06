-- Add ban and call count columns for admin functionality
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS call_count INTEGER DEFAULT 0;
