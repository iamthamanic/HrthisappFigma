-- ============================================
-- QUICK FIX: COIN TRANSACTIONS RLS POLICIES
-- ============================================
-- Problem: coin_transactions table has no RLS policies
-- Admins can't distribute coins because INSERT is blocked
-- ============================================

-- 1. Enable RLS on coin_transactions
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;

-- 2. Users can view their own transactions
DROP POLICY IF EXISTS "Users can view own coin transactions" ON coin_transactions;
CREATE POLICY "Users can view own coin transactions"
  ON coin_transactions FOR SELECT
  USING (user_id = auth.uid());

-- 3. Admins can view all transactions
DROP POLICY IF EXISTS "Admins can view all coin transactions" ON coin_transactions;
CREATE POLICY "Admins can view all coin transactions"
  ON coin_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('ADMIN', 'HR', 'SUPERADMIN')
    )
  );

-- 4. Admins can insert coin transactions (distribute coins)
DROP POLICY IF EXISTS "Admins can insert coin transactions" ON coin_transactions;
CREATE POLICY "Admins can insert coin transactions"
  ON coin_transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('ADMIN', 'HR', 'SUPERADMIN')
    )
  );

-- 5. System can insert via SECURITY DEFINER functions
DROP POLICY IF EXISTS "System can insert coin transactions" ON coin_transactions;
CREATE POLICY "System can insert coin transactions"
  ON coin_transactions FOR INSERT
  WITH CHECK (true); -- Allows SECURITY DEFINER functions to insert

-- 6. Users can update their own transactions (for spent coins)
DROP POLICY IF EXISTS "Users can update own coin transactions" ON coin_transactions;
CREATE POLICY "Users can update own coin transactions"
  ON coin_transactions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ COIN TRANSACTIONS RLS POLICIES FIXED!';
  RAISE NOTICE '🔒 RLS enabled on coin_transactions';
  RAISE NOTICE '👥 Users can view their own transactions';
  RAISE NOTICE '👨‍💼 Admins can view and distribute coins';
  RAISE NOTICE '🚀 Coin distribution should work now!';
END $$;
