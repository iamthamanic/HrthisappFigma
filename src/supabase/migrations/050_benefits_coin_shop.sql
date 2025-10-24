-- ============================================
-- MIGRATION 050: BENEFITS COIN SHOP INTEGRATION
-- ============================================
-- Version: 3.8.0
-- Date: 2025-01-12
-- Description: Adds coin purchase capabilities to Benefits System
-- ============================================

-- ============================================
-- 1. EXTEND BENEFITS TABLE
-- ============================================

-- Add coin shop columns to benefits
ALTER TABLE benefits 
  ADD COLUMN IF NOT EXISTS coin_price INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS purchase_type TEXT DEFAULT 'REQUEST_ONLY' 
    CHECK (purchase_type IN ('COINS_ONLY', 'REQUEST_ONLY', 'BOTH')),
  ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS instant_approval BOOLEAN DEFAULT false;

-- Add comments
COMMENT ON COLUMN benefits.coin_price IS 'Preis in Coins. NULL = nicht mit Coins kaufbar';
COMMENT ON COLUMN benefits.purchase_type IS 'COINS_ONLY (nur kaufbar), REQUEST_ONLY (nur Antrag), BOTH (beides möglich)';
COMMENT ON COLUMN benefits.requires_approval IS 'Wenn true, auch Coin-Käufe brauchen Admin-Genehmigung';
COMMENT ON COLUMN benefits.instant_approval IS 'Wenn true, Coin-Käufe sind sofort approved (nur wenn requires_approval=false)';

-- ============================================
-- 2. COIN BENEFIT PURCHASES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS coin_benefit_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  benefit_id UUID NOT NULL REFERENCES benefits(id) ON DELETE CASCADE,
  coin_amount INTEGER NOT NULL,
  coin_transaction_id UUID REFERENCES coin_transactions(id) ON DELETE SET NULL,
  user_benefit_id UUID REFERENCES user_benefits(id) ON DELETE CASCADE,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- User kann ein Benefit nur 1x kaufen
  UNIQUE(user_id, benefit_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_coin_benefit_purchases_user ON coin_benefit_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_benefit_purchases_benefit ON coin_benefit_purchases(benefit_id);
CREATE INDEX IF NOT EXISTS idx_coin_benefit_purchases_purchased_at ON coin_benefit_purchases(purchased_at DESC);

-- ============================================
-- 3. RLS POLICIES - COIN BENEFIT PURCHASES
-- ============================================

ALTER TABLE coin_benefit_purchases ENABLE ROW LEVEL SECURITY;

-- Policy: User sieht eigene Käufe
CREATE POLICY "Users can view own purchases"
ON coin_benefit_purchases FOR SELECT
USING (user_id = auth.uid());

-- Policy: Admin/HR/Superadmin sehen alle Käufe ihrer Org
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

-- Policy: System kann Käufe erstellen (für Service Layer)
CREATE POLICY "System can create purchases"
ON coin_benefit_purchases FOR INSERT
WITH CHECK (true);

-- ============================================
-- 4. REFUND FUNCTION (Coins zurückerstatten bei Ablehnung)
-- ============================================

CREATE OR REPLACE FUNCTION refund_coins_on_rejection()
RETURNS TRIGGER AS $$
DECLARE
  v_purchase RECORD;
BEGIN
  -- Nur bei Änderung von PENDING/APPROVED zu REJECTED
  IF OLD.status != 'REJECTED' AND NEW.status = 'REJECTED' THEN
    -- Check ob dieser Benefit mit Coins gekauft wurde
    SELECT * INTO v_purchase
    FROM coin_benefit_purchases
    WHERE user_benefit_id = NEW.id;
    
    IF FOUND THEN
      -- Erstelle Refund-Transaction
      INSERT INTO coin_transactions (
        user_id,
        amount,
        reason,
        type,
        metadata
      ) VALUES (
        NEW.user_id,
        v_purchase.coin_amount, -- Positive amount = EARNED
        'Refund: Benefit abgelehnt - ' || (SELECT title FROM benefits WHERE id = NEW.benefit_id),
        'EARNED',
        jsonb_build_object(
          'refund', true,
          'original_purchase_id', v_purchase.id,
          'benefit_id', NEW.benefit_id
        )
      );
      
      RAISE NOTICE 'Coins refunded: % coins to user %', v_purchase.coin_amount, NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Refund bei Ablehnung
DROP TRIGGER IF EXISTS trigger_refund_coins_on_rejection ON user_benefits;
CREATE TRIGGER trigger_refund_coins_on_rejection
AFTER UPDATE OF status ON user_benefits
FOR EACH ROW
WHEN (NEW.status = 'REJECTED')
EXECUTE FUNCTION refund_coins_on_rejection();

-- ============================================
-- 5. EXAMPLE DATA (Optional - auskommentiert)
-- ============================================

/*
-- Beispiel: Benefit mit Coin-Preis erstellen
UPDATE benefits
SET 
  coin_price = 500,
  purchase_type = 'BOTH',
  requires_approval = false,
  instant_approval = true
WHERE title = 'Essenszuschuss';

-- Beispiel: Benefit nur mit Coins kaufbar
UPDATE benefits
SET 
  coin_price = 1000,
  purchase_type = 'COINS_ONLY',
  requires_approval = false,
  instant_approval = true
WHERE title = 'Fitnessstudio-Mitgliedschaft';

-- Beispiel: Benefit mit Coins ODER Antrag
UPDATE benefits
SET 
  coin_price = 2000,
  purchase_type = 'BOTH',
  requires_approval = true,
  instant_approval = false
WHERE title = 'Firmenwagen';
*/

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Next Steps:
-- 1. ✅ Run this migration in Supabase SQL Editor
-- 2. Update TypeScript types in /types/schemas/HRTHIS_benefitSchemas.ts
-- 3. Extend service in /services/HRTHIS_benefitsService.ts
-- 4. Update UI components
-- 5. Test purchase flow
-- ============================================
