-- ============================================
-- QUICK FIX: Migration 050 - Fehlende Columns
-- ============================================
-- Problem: ALTER TABLE Statements wurden nicht ausgeführt
-- Lösung: Columns zur benefits Tabelle hinzufügen
-- ============================================

-- Add missing columns to benefits table
ALTER TABLE benefits 
  ADD COLUMN IF NOT EXISTS coin_price INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS purchase_type TEXT DEFAULT 'REQUEST_ONLY' 
    CHECK (purchase_type IN ('COINS_ONLY', 'REQUEST_ONLY', 'BOTH')),
  ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS instant_approval BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN benefits.coin_price IS 'Preis in Coins. NULL = nicht mit Coins kaufbar';
COMMENT ON COLUMN benefits.purchase_type IS 'COINS_ONLY (nur kaufbar), REQUEST_ONLY (nur Antrag), BOTH (beides möglich)';
COMMENT ON COLUMN benefits.requires_approval IS 'Wenn true, auch Coin-Käufe brauchen Admin-Genehmigung';
COMMENT ON COLUMN benefits.instant_approval IS 'Wenn true, Coin-Käufe sind sofort approved (nur wenn requires_approval=false)';

-- Verify columns exist
DO $$
DECLARE
  v_coin_price_exists BOOLEAN;
  v_purchase_type_exists BOOLEAN;
  v_requires_approval_exists BOOLEAN;
  v_instant_approval_exists BOOLEAN;
BEGIN
  -- Check if all columns exist
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'benefits' AND column_name = 'coin_price'
  ) INTO v_coin_price_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'benefits' AND column_name = 'purchase_type'
  ) INTO v_purchase_type_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'benefits' AND column_name = 'requires_approval'
  ) INTO v_requires_approval_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'benefits' AND column_name = 'instant_approval'
  ) INTO v_instant_approval_exists;
  
  -- Report results
  IF v_coin_price_exists AND v_purchase_type_exists AND v_requires_approval_exists AND v_instant_approval_exists THEN
    RAISE NOTICE '✅ ALL COLUMNS EXIST!';
    RAISE NOTICE '   ✅ coin_price';
    RAISE NOTICE '   ✅ purchase_type';
    RAISE NOTICE '   ✅ requires_approval';
    RAISE NOTICE '   ✅ instant_approval';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Migration 050 Columns Fix COMPLETE!';
  ELSE
    RAISE NOTICE '⚠️ SOME COLUMNS STILL MISSING:';
    IF NOT v_coin_price_exists THEN
      RAISE NOTICE '   ❌ coin_price - MISSING';
    END IF;
    IF NOT v_purchase_type_exists THEN
      RAISE NOTICE '   ❌ purchase_type - MISSING';
    END IF;
    IF NOT v_requires_approval_exists THEN
      RAISE NOTICE '   ❌ requires_approval - MISSING';
    END IF;
    IF NOT v_instant_approval_exists THEN
      RAISE NOTICE '   ❌ instant_approval - MISSING';
    END IF;
  END IF;
END $$;

-- Test query to verify structure
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'benefits'
  AND column_name IN ('coin_price', 'purchase_type', 'requires_approval', 'instant_approval')
ORDER BY column_name;
