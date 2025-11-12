-- =====================================================
-- CHECK SHIFTS TABLE STRUCTURE
-- =====================================================
-- Führe das aus und schick mir die Ergebnisse!
-- =====================================================

-- 1. Show all columns
SELECT 
  column_name as "Column Name",
  data_type as "Data Type",
  is_nullable as "Nullable?",
  column_default as "Default Value"
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'shifts'
ORDER BY ordinal_position;

-- 2. Check if shift_type exists
SELECT 
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'shifts'
    AND column_name = 'shift_type'
  ) as "shift_type exists?";

-- 3. Check if created_by exists
SELECT 
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'shifts'
    AND column_name = 'created_by'
  ) as "created_by exists?";

-- 4. Check constraints
SELECT
  conname as "Constraint Name",
  pg_get_constraintdef(c.oid) as "Constraint Definition"
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE n.nspname = 'public'
AND conrelid = 'public.shifts'::regclass
ORDER BY conname;
