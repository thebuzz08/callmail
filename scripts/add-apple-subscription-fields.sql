-- Add Apple In-App Purchase fields to subscriptions table
-- This allows supporting both Stripe (web) and Apple IAP (iOS) subscriptions

-- Add Apple-specific fields to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS apple_original_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS apple_product_id TEXT,
ADD COLUMN IF NOT EXISTS apple_environment TEXT DEFAULT 'production',
ADD COLUMN IF NOT EXISTS apple_latest_receipt TEXT,
ADD COLUMN IF NOT EXISTS apple_expires_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'web';

-- Create index for Apple transaction lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_apple_transaction 
ON subscriptions(apple_original_transaction_id) 
WHERE apple_original_transaction_id IS NOT NULL;

-- Create index for platform-based queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_platform 
ON subscriptions(platform);

-- Add comment for documentation
COMMENT ON COLUMN subscriptions.apple_original_transaction_id IS 'Apple original_transaction_id for IAP receipts';
COMMENT ON COLUMN subscriptions.apple_product_id IS 'Apple product identifier (e.g., com.callmail.pro.monthly)';
COMMENT ON COLUMN subscriptions.apple_environment IS 'Apple environment: sandbox or production';
COMMENT ON COLUMN subscriptions.apple_latest_receipt IS 'Latest Apple receipt data for server-to-server validation';
COMMENT ON COLUMN subscriptions.apple_expires_date IS 'Apple subscription expiration date from receipt';
COMMENT ON COLUMN subscriptions.platform IS 'Subscription platform: web (Stripe), ios (Apple IAP), android (Google Play)';
