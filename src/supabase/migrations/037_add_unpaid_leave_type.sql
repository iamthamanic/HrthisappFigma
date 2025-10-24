-- ============================================
-- MIGRATION 037: Add UNPAID_LEAVE Type
-- ============================================
-- Adds new leave type for unpaid absences
-- UNPAID_LEAVE does NOT affect vacation quota

-- NOTE: PostgreSQL doesn't support adding enum values in a transaction-safe way with IF NOT EXISTS
-- We need to check if the value already exists before adding it

-- STEP 1: Create leave_type enum if it doesn't exist
DO $
BEGIN
  -- Check if leave_type enum exists
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'leave_type') THEN
    -- Create enum with base values
    CREATE TYPE leave_type AS ENUM ('VACATION', 'SICK');
    RAISE NOTICE '✅ Created leave_type ENUM with base values (VACATION, SICK)';
  ELSE
    RAISE NOTICE '⚠️  leave_type ENUM already exists';
  END IF;
END $;

-- STEP 2: Add UNPAID_LEAVE to leave type enum
DO $
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
END $;

-- Add optional payroll flag for future use
ALTER TABLE public.leave_requests
  ADD COLUMN IF NOT EXISTS affects_payroll BOOLEAN DEFAULT true;

COMMENT ON COLUMN public.leave_requests.affects_payroll IS 
  'If true, this leave affects payroll/salary (e.g., unpaid leave reduces salary). 
   If false, leave is fully paid (e.g., regular vacation, sick leave covered by insurance).
   This field is prepared for future payroll integration.';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 037 completed: UNPAID_LEAVE type added';
  RAISE NOTICE '   - New leave types: VACATION, SICK, UNPAID_LEAVE';
  RAISE NOTICE '   - affects_payroll column added for future payroll integration';
  RAISE NOTICE '   - UNPAID_LEAVE will NOT reduce vacation quota';
END $$;
