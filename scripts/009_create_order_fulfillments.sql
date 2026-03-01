-- Create order_fulfillments table to track fulfilled orders and prevent double-fulfillment
CREATE TABLE IF NOT EXISTS order_fulfillments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  credits_added INTEGER DEFAULT 0,
  fulfilled_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_order_fulfillments_session ON order_fulfillments(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_order_fulfillments_user ON order_fulfillments(user_id);

-- Enable RLS
ALTER TABLE order_fulfillments ENABLE ROW LEVEL SECURITY;

-- Drop policies first then create (IF NOT EXISTS not supported for policies)
DROP POLICY IF EXISTS "Users can view own fulfillments" ON order_fulfillments;
CREATE POLICY "Users can view own fulfillments"
  ON order_fulfillments FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can insert fulfillments" ON order_fulfillments;
CREATE POLICY "Service role can insert fulfillments"
  ON order_fulfillments FOR INSERT
  WITH CHECK (true);
