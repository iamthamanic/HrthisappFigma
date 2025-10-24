-- ============================================
-- FIX: Create leave_type ENUM + Add UNPAID_LEAVE
-- ============================================
-- Problem: Type "leave_type" does not exist
-- Lösung: Erstelle Type falls nicht vorhanden, dann füge UNPAID_LEAVE hinzu
-- ============================================

-- STEP 1: Create leave_type enum if it doesn't exist
DO $$
BEGIN
  -- Check if leave_type enum exists
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'leave_type') THEN
    -- Create enum with base values
    CREATE TYPE leave_type AS ENUM ('VACATION', 'SICK');
    RAISE NOTICE '✅ Created leave_type ENUM with base values (VACATION, SICK)';
  ELSE
    RAISE NOTICE '⚠️  leave_type ENUM already exists';
  END IF;
END $$;

-- STEP 2: Add UNPAID_LEAVE value if it doesn't exist
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

-- STEP 3: Ensure leave_requests table has correct type column
DO $$
BEGIN
  -- Check if leave_requests table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'leave_requests'
  ) THEN
    -- Check if type column exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'leave_requests'
      AND column_name = 'type'
    ) THEN
      -- Add type column
      ALTER TABLE public.leave_requests
        ADD COLUMN type leave_type NOT NULL DEFAULT 'VACATION';
      RAISE NOTICE '✅ Added type column to leave_requests table';
    ELSE
      RAISE NOTICE '✅ type column already exists in leave_requests table';
    END IF;
  ELSE
    RAISE NOTICE '⚠️  leave_requests table does not exist yet - will be created later';
  END IF;
END $$;

-- STEP 4: Add optional payroll flag
ALTER TABLE public.leave_requests
  ADD COLUMN IF NOT EXISTS affects_payroll BOOLEAN DEFAULT true;

COMMENT ON COLUMN public.leave_requests.affects_payroll IS 
  'If true, this leave affects payroll/salary (e.g., unpaid leave reduces salary). 
   If false, leave is fully paid (e.g., regular vacation, sick leave covered by insurance).
   This field is prepared for future payroll integration.';

-- STEP 5: Verify and display results
DO $$
DECLARE
  enum_values TEXT;
  leave_count INT;
BEGIN
  -- Get all enum values
  SELECT string_agg(enumlabel, ', ' ORDER BY enumlabel) INTO enum_values
  FROM pg_enum 
  WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'leave_type');
  
  -- Count leave requests
  SELECT COUNT(*) INTO leave_count FROM public.leave_requests;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ LEAVE TYPE ENUM FIX COMPLETED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Leave Types verfügbar: %', enum_values;
  RAISE NOTICE '📝 Gesamt Leave Requests: %', leave_count;
  RAISE NOTICE '';
  RAISE NOTICE '🎨 Farb-Schema:';
  RAISE NOTICE '   🟢 VACATION = Grün (Genehmigt)';
  RAISE NOTICE '   🔵 SICK = Blau (Krankmeldung)';
  RAISE NOTICE '   🟣 UNPAID_LEAVE = Lila (Unbezahlt)';
  RAISE NOTICE '   🔴 REJECTED Status = Rot';
  RAISE NOTICE '   🟡 PENDING Status = Gelb';
  RAISE NOTICE '';
  RAISE NOTICE '🔴 TEAM-KALENDER (Privacy-First):';
  RAISE NOTICE '   Alle Abwesenheiten = ROTER RING';
  RAISE NOTICE '   (Kein Grund sichtbar - Datenschutz)';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Nächster Schritt:';
  RAISE NOTICE '   1. Browser refreshen (Cmd+R / Ctrl+R)';
  RAISE NOTICE '   2. Gehe zu /calendar';
  RAISE NOTICE '   3. Teste "Urlaub/Abwesenheit" Button';
  RAISE NOTICE '   4. Wähle "Unbezahlte Abwesenheit"';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
