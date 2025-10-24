-- ============================================
-- COPY-PASTE THIS NOW ✅
-- ============================================
-- 1. Kopiere ALLES (Cmd+A / Ctrl+A)
-- 2. Öffne Supabase → SQL Editor
-- 3. Paste (Cmd+V / Ctrl+V)
-- 4. Klicke RUN
-- ============================================

-- Create leave_type enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'leave_type') THEN
    CREATE TYPE leave_type AS ENUM ('VACATION', 'SICK');
    RAISE NOTICE '✅ Created leave_type ENUM';
  END IF;
END $$;

-- Add UNPAID_LEAVE value
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'UNPAID_LEAVE' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'leave_type')
  ) THEN
    ALTER TYPE leave_type ADD VALUE 'UNPAID_LEAVE';
    RAISE NOTICE '✅ Added UNPAID_LEAVE';
  END IF;
END $$;

-- Add payroll flag
ALTER TABLE public.leave_requests
  ADD COLUMN IF NOT EXISTS affects_payroll BOOLEAN DEFAULT true;

-- Done!
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ MIGRATION COMPLETED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Nächster Schritt:';
  RAISE NOTICE '   1. Browser refreshen (Cmd+R)';
  RAISE NOTICE '   2. Gehe zu /calendar';
  RAISE NOTICE '   3. Klicke "Urlaub/Abwesenheit"';
  RAISE NOTICE '   4. Sieh 📅 Unbezahlte Abwesenheit Button';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
