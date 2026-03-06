-- Enable RLS on call_costs table
ALTER TABLE call_costs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own call costs
CREATE POLICY "Users can view their own call costs"
ON call_costs FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Service role can insert/update costs (for the system)
CREATE POLICY "Service role can manage costs"
ON call_costs FOR ALL
USING (auth.role() = 'service_role');
