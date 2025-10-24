-- ============================================
-- QUICK COPY: Unbezahlte Abwesenheit Migration
-- ============================================
-- 1. Kopiere diesen kompletten Code
-- 2. Öffne Supabase Dashboard → SQL Editor
-- 3. Füge ein (Cmd+V / Ctrl+V)
-- 4. Klicke RUN
-- ============================================

-- Add UNPAID_LEAVE to leave_type enum
DO $$
BEGIN
  -- Check if UNPAID_LEAVE value already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'UNPAID_LEAVE' 
    AND enumtypid = (
      SELECT oid FROM pg_type WHERE typname = 'leave_type'
    )
  ) THEN
    -- Add new enum value
    ALTER TYPE leave_type ADD VALUE 'UNPAID_LEAVE';
    RAISE NOTICE '✅ Added UNPAID_LEAVE to leave_type enum';
  ELSE
    RAISE NOTICE '⚠️  UNPAID_LEAVE already exists in leave_type enum';
  END IF;
END $$;

-- Add optional payroll flag for future use
ALTER TABLE public.leave_requests
  ADD COLUMN IF NOT EXISTS affects_payroll BOOLEAN DEFAULT true;

COMMENT ON COLUMN public.leave_requests.affects_payroll IS 
  'If true, this leave affects payroll/salary (e.g., unpaid leave reduces salary). 
   If false, leave is fully paid (e.g., regular vacation, sick leave covered by insurance).
   This field is prepared for future payroll integration.';

-- Verify enum values
DO $$
DECLARE
  enum_values TEXT;
BEGIN
  SELECT string_agg(enumlabel, ', ' ORDER BY enumlabel) INTO enum_values
  FROM pg_enum 
  WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'leave_type');
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ MIGRATION 037 COMPLETED SUCCESSFULLY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Leave Types verfügbar: %', enum_values;
  RAISE NOTICE '';
  RAISE NOTICE '🎨 Farb-Schema:';
  RAISE NOTICE '   🟢 VACATION = Grün';
  RAISE NOTICE '   🔵 SICK = Blau';
  RAISE NOTICE '   🟣 UNPAID_LEAVE = Lila';
  RAISE NOTICE '   🔴 REJECTED Status = Rot';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Nächster Schritt:';
  RAISE NOTICE '   1. Browser refreshen (Cmd+R / Ctrl+R)';
  RAISE NOTICE '   2. Gehe zu /time-and-leave';
  RAISE NOTICE '   3. Teste "Unbezahlte Abwesenheit" Button';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
