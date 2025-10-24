-- ============================================
-- QUICK FIX: Migration 050 Policies
-- ============================================
-- Problem: Policies existieren schon, müssen aber neu erstellt werden
-- Lösung: DROP IF EXISTS + CREATE
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own purchases" ON coin_benefit_purchases;
DROP POLICY IF EXISTS "Admins can view all purchases in org" ON coin_benefit_purchases;
DROP POLICY IF EXISTS "System can create purchases" ON coin_benefit_purchases;

-- Recreate policies
CREATE POLICY "Users can view own purchases"
ON coin_benefit_purchases FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all purchases in org"
ON coin_benefit_purchases FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('ADMIN', 'HR', 'SUPERADMIN')
    AND organization_id IN (
      SELECT organization_id FROM users WHERE id = coin_benefit_purchases.user_id
    )
  )
);

CREATE POLICY "System can create purchases"
ON coin_benefit_purchases FOR INSERT
WITH CHECK (true);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 050 Policies fixed!';
END $$;
