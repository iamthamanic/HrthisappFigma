-- =====================================================
-- SCHICHTPLANUNG SYSTEM - MIGRATION v4.12.0
-- =====================================================
-- Adds specialization to users + extends shifts table
-- =====================================================

-- =====================================================
-- 1. ADD SPECIALIZATION TO USERS TABLE
-- =====================================================

-- Add specialization column to users
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'specialization'
  ) THEN
    ALTER TABLE public.users ADD COLUMN specialization TEXT;
    RAISE NOTICE '✅ Added specialization column to users table';
  ELSE
    RAISE NOTICE 'ℹ️  specialization column already exists in users table';
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_specialization ON public.users(specialization);

-- =====================================================
-- 2. EXTEND SHIFTS TABLE
-- =====================================================

-- Add location_id to shifts
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shifts' 
    AND column_name = 'location_id'
  ) THEN
    ALTER TABLE public.shifts ADD COLUMN location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL;
    RAISE NOTICE '✅ Added location_id column to shifts table';
  ELSE
    RAISE NOTICE 'ℹ️  location_id column already exists in shifts table';
  END IF;
END $$;

-- Add department_id to shifts
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shifts' 
    AND column_name = 'department_id'
  ) THEN
    ALTER TABLE public.shifts ADD COLUMN department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;
    RAISE NOTICE '✅ Added department_id column to shifts table';
  ELSE
    RAISE NOTICE 'ℹ️  department_id column already exists in shifts table';
  END IF;
END $$;

-- Add specialization to shifts
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shifts' 
    AND column_name = 'specialization'
  ) THEN
    ALTER TABLE public.shifts ADD COLUMN specialization TEXT;
    RAISE NOTICE '✅ Added specialization column to shifts table';
  ELSE
    RAISE NOTICE 'ℹ️  specialization column already exists in shifts table';
  END IF;
END $$;

-- Create indexes for shifts
CREATE INDEX IF NOT EXISTS idx_shifts_location_id ON public.shifts(location_id);
CREATE INDEX IF NOT EXISTS idx_shifts_department_id ON public.shifts(department_id);
CREATE INDEX IF NOT EXISTS idx_shifts_specialization ON public.shifts(specialization);

-- =====================================================
-- 3. SYNC ORGANIGRAM SPECIALIZATION TO USERS
-- =====================================================
-- Trigger: When organigram node is updated, sync specialization to user

CREATE OR REPLACE FUNCTION sync_organigram_specialization_to_user()
RETURNS TRIGGER AS $$
BEGIN
  -- If employee_id is set and specialization changed, update user
  IF NEW.employee_id IS NOT NULL AND (NEW.specialization IS DISTINCT FROM OLD.specialization) THEN
    UPDATE public.users
    SET specialization = NEW.specialization
    WHERE id = NEW.employee_id;
    
    RAISE NOTICE '✅ Synced specialization "%" to user %', NEW.specialization, NEW.employee_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_sync_organigram_specialization ON public.organigram_nodes;

-- Create trigger
CREATE TRIGGER trigger_sync_organigram_specialization
  AFTER UPDATE ON public.organigram_nodes
  FOR EACH ROW
  EXECUTE FUNCTION sync_organigram_specialization_to_user();

DO $$ 
BEGIN
  RAISE NOTICE '✅ Created trigger to sync organigram specialization to users';
END $$;

-- =====================================================
-- 4. INITIAL SYNC (EXISTING DATA)
-- =====================================================
-- Sync existing organigram specializations to users

UPDATE public.users u
SET specialization = n.specialization
FROM public.organigram_nodes n
WHERE n.employee_id = u.id
  AND n.specialization IS NOT NULL
  AND u.specialization IS DISTINCT FROM n.specialization;

DO $$ 
BEGIN
  RAISE NOTICE '✅ Synced existing organigram specializations to users';
END $$;

-- =====================================================
-- 5. UPDATE RLS POLICIES (if needed)
-- =====================================================
-- Shifts RLS already exists from CREATE_SHIFTS_TABLE.sql
-- No changes needed, but verify policies work with new columns

-- =====================================================
-- VERIFICATION & SUMMARY
-- =====================================================

-- Display summary
DO $$
DECLARE
  users_with_spec INTEGER;
  shifts_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO users_with_spec FROM public.users WHERE specialization IS NOT NULL;
  SELECT COUNT(*) INTO shifts_count FROM public.shifts;
  
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ SCHICHTPLANUNG MIGRATION v4.12.0 COMPLETE!';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Users with specialization: %', users_with_spec;
  RAISE NOTICE 'Total shifts: %', shifts_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Schema changes:';
  RAISE NOTICE '  ✅ users.specialization (TEXT)';
  RAISE NOTICE '  ✅ shifts.location_id (UUID → locations)';
  RAISE NOTICE '  ✅ shifts.department_id (UUID → departments)';
  RAISE NOTICE '  ✅ shifts.specialization (TEXT)';
  RAISE NOTICE '';
  RAISE NOTICE 'Triggers:';
  RAISE NOTICE '  ✅ sync_organigram_specialization_to_user()';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Deploy Schichtplanung UI Components';
  RAISE NOTICE '================================================';
END $$;
