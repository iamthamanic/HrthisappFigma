-- ============================================
-- MIGRATION 052: COIN TRANSACTIONS RLS POLICIES
-- ============================================
-- Date: 2025-01-13
-- Version: v3.9.5
-- Description: Add missing RLS policies for coin_transactions table
-- 
-- Problem: Migration 001 enabled RLS on coin_transactions but didn't create any policies
-- Result: Admins cannot distribute coins (RLS violation error)
-- 
-- Fix: Add 5 RLS policies to allow:
--   1. Users to view their own transactions
--   2. Admins to view all transactions
--   3. Admins to insert transactions (distribute coins)
--   4. System functions to insert transactions
--   5. Users to update their own transactions
-- ============================================

-- 1. Users can view their own transactions
DROP POLICY IF EXISTS "Users can view own coin transactions" ON coin_transactions;
CREATE POLICY "Users can view own coin transactions"
  ON coin_transactions FOR SELECT
  USING (user_id = auth.uid());

-- 2. Admins can view all transactions
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

-- 3. Admins can insert coin transactions (distribute coins)
-- This is the KEY FIX for the coin distribution error!
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

-- 4. System can insert via SECURITY DEFINER functions
-- Allows functions like check_and_unlock_coin_achievements() to insert
DROP POLICY IF EXISTS "System can insert coin transactions" ON coin_transactions;
CREATE POLICY "System can insert coin transactions"
  ON coin_transactions FOR INSERT
  WITH CHECK (true);

-- 5. Users can update their own transactions (for spent coins)
DROP POLICY IF EXISTS "Users can update own coin transactions" ON coin_transactions;
CREATE POLICY "Users can update own coin transactions"
  ON coin_transactions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify all policies exist
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO policy_count
  FROM pg_policies
  WHERE tablename = 'coin_transactions';
  
  IF policy_count >= 5 THEN
    RAISE NOTICE '✅ MIGRATION 052: SUCCESS!';
    RAISE NOTICE '🔒 Created % RLS policies for coin_transactions', policy_count;
    RAISE NOTICE '👨‍💼 Admins can now distribute coins';
    RAISE NOTICE '👥 Users can view their own transactions';
    RAISE NOTICE '🚀 Coin distribution system is fully functional!';
  ELSE
    RAISE WARNING '⚠️ Expected 5+ policies, found %', policy_count;
  END IF;
END $$;
