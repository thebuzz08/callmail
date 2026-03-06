-- Add quiet hours columns to user_settings
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS quiet_hours_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS quiet_hours_start text DEFAULT '23:00',
ADD COLUMN IF NOT EXISTS quiet_hours_end text DEFAULT '07:00',
ADD COLUMN IF NOT EXISTS quiet_hours_timezone text DEFAULT 'America/New_York';
