-- =====================================================
-- SCHICHTPLANUNG COMPLETE SETUP
-- =====================================================
-- Run this ONCE in Supabase SQL Editor
-- This creates: shifts table + extensions + test data
-- =====================================================

-- =====================================================
-- STEP 1: CREATE SHIFTS TABLE
-- =====================================================

-- Create shifts table
CREATE TABLE IF NOT EXISTS public.shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  shift_type TEXT NOT NULL, -- 'MORNING', 'AFTERNOON', 'NIGHT', 'ON_CALL', etc.
  start_time TIME,
  end_time TIME,
  notes TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shifts_date ON public.shifts(date);
CREATE INDEX IF NOT EXISTS idx_shifts_user_id ON public.shifts(user_id);
CREATE INDEX IF NOT EXISTS idx_shifts_team_id ON public.shifts(team_id);
CREATE INDEX IF NOT EXISTS idx_shifts_created_by ON public.shifts(created_by);

-- Add RLS policies
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view shifts they are assigned to or shifts in their team
DROP POLICY IF EXISTS "Users can view their own shifts or team shifts" ON public.shifts;
CREATE POLICY "Users can view their own shifts or team shifts"
  ON public.shifts
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    auth.uid() IN (
      SELECT user_id FROM public.team_members
      WHERE team_id = shifts.team_id
    )
    OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('HR_SUPERADMIN', 'HR_MANAGER')
    )
  );

-- Policy: Only HR and Teamleads can create shifts
DROP POLICY IF EXISTS "HR and Teamleads can create shifts" ON public.shifts;
CREATE POLICY "HR and Teamleads can create shifts"
  ON public.shifts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('HR_SUPERADMIN', 'HR_MANAGER')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE user_id = auth.uid()
      AND role = 'TEAMLEAD'
    )
  );

-- Policy: HR, Teamleads, and shift creator can update shifts
DROP POLICY IF EXISTS "HR, Teamleads, and creator can update shifts" ON public.shifts;
CREATE POLICY "HR, Teamleads, and creator can update shifts"
  ON public.shifts
  FOR UPDATE
  USING (
    auth.uid() = created_by
    OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('HR_SUPERADMIN', 'HR_MANAGER')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE user_id = auth.uid()
      AND team_id = shifts.team_id
      AND role = 'TEAMLEAD'
    )
  );

-- Policy: HR, Teamleads, and shift creator can delete shifts
DROP POLICY IF EXISTS "HR, Teamleads, and creator can delete shifts" ON public.shifts;
CREATE POLICY "HR, Teamleads, and creator can delete shifts"
  ON public.shifts
  FOR DELETE
  USING (
    auth.uid() = created_by
    OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('HR_SUPERADMIN', 'HR_MANAGER')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE user_id = auth.uid()
      AND team_id = shifts.team_id
      AND role = 'TEAMLEAD'
    )
  );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_shifts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS shifts_updated_at_trigger ON public.shifts;
CREATE TRIGGER shifts_updated_at_trigger
  BEFORE UPDATE ON public.shifts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_shifts_updated_at();

-- Verify table creation
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'shifts'
  ) THEN
    RAISE NOTICE '✅ STEP 1: Shifts table created successfully!';
  ELSE
    RAISE EXCEPTION '❌ Failed to create shifts table!';
  END IF;
END $$;

-- =====================================================
-- STEP 2: ADD SPECIALIZATION & EXTEND SHIFTS
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

DO $$ 
BEGIN
  RAISE NOTICE '✅ STEP 2: Schema extensions complete!';
END $$;

-- =====================================================
-- STEP 3: CREATE TEST DATA (OPTIONAL)
-- =====================================================

DO $$
DECLARE
  test_user_id UUID;
  test_team_id UUID;
  test_location_id UUID;
  test_department_id UUID;
BEGIN
  -- Get first user
  SELECT id INTO test_user_id FROM public.users WHERE role = 'EMPLOYEE' LIMIT 1;
  
  -- Get first team
  SELECT id INTO test_team_id FROM public.teams LIMIT 1;
  
  -- Get first location
  SELECT id INTO test_location_id FROM public.locations LIMIT 1;
  
  -- Get first department
  SELECT id INTO test_department_id FROM public.departments LIMIT 1;
  
  -- Create test shifts for this week
  IF test_user_id IS NOT NULL THEN
    -- Monday shift
    INSERT INTO public.shifts (
      user_id,
      team_id,
      date,
      shift_type,
      start_time,
      end_time,
      specialization,
      location_id,
      department_id,
      notes
    ) VALUES (
      test_user_id,
      test_team_id,
      CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 1, -- This Monday
      'MORNING',
      '08:00',
      '16:00',
      'Baustelle',
      test_location_id,
      test_department_id,
      'Test Schicht Montag'
    ) ON CONFLICT DO NOTHING;
    
    -- Wednesday shift
    INSERT INTO public.shifts (
      user_id,
      team_id,
      date,
      shift_type,
      start_time,
      end_time,
      specialization,
      location_id,
      department_id,
      notes
    ) VALUES (
      test_user_id,
      test_team_id,
      CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 3, -- This Wednesday
      'AFTERNOON',
      '12:00',
      '20:00',
      'BACKSTUBE',
      test_location_id,
      test_department_id,
      'Test Schicht Mittwoch'
    ) ON CONFLICT DO NOTHING;
    
    RAISE NOTICE '✅ Created 2 test shifts for user %', test_user_id;
  ELSE
    RAISE NOTICE '⚠️  No users found - cannot create test shifts';
  END IF;
END $$;

-- Add specializations to users
WITH numbered_users AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY id) AS rn
  FROM public.users
  WHERE role = 'EMPLOYEE'
  LIMIT 5
)
UPDATE public.users u
SET specialization = (
  CASE 
    WHEN MOD(nu.rn, 5) = 0 THEN 'Baustelle'
    WHEN MOD(nu.rn, 5) = 1 THEN 'BACKSTUBE'
    WHEN MOD(nu.rn, 5) = 2 THEN 'GEMÜSE'
    WHEN MOD(nu.rn, 5) = 3 THEN 'SCHUMIBÄCKER ZONE'
    ELSE 'NETZWERKRAUM-APPLE'
  END
)
FROM numbered_users nu
WHERE u.id = nu.id;

DO $$ 
BEGIN
  RAISE NOTICE '✅ STEP 3: Test data created!';
END $$;

-- =====================================================
-- FINAL SUMMARY
-- =====================================================

DO $$
DECLARE
  shifts_count INTEGER;
  users_with_spec INTEGER;
BEGIN
  SELECT COUNT(*) INTO shifts_count FROM public.shifts;
  SELECT COUNT(*) INTO users_with_spec FROM public.users WHERE specialization IS NOT NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================================';
  RAISE NOTICE '✅ SCHICHTPLANUNG SETUP COMPLETE!';
  RAISE NOTICE '========================================================';
  RAISE NOTICE 'Total shifts: %', shifts_count;
  RAISE NOTICE 'Users with specialization: %', users_with_spec;
  RAISE NOTICE '';
  RAISE NOTICE 'Schema:';
  RAISE NOTICE '  ✅ shifts table (with RLS policies)';
  RAISE NOTICE '  ✅ users.specialization';
  RAISE NOTICE '  ✅ shifts.location_id';
  RAISE NOTICE '  ✅ shifts.department_id';
  RAISE NOTICE '  ✅ shifts.specialization';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Open Field Verwaltung → Einsatzplanung → Schichtplanung';
  RAISE NOTICE '========================================================';
END $$;

-- Display created shifts
SELECT 
  s.id,
  u.first_name || ' ' || u.last_name as employee,
  s.date,
  s.shift_type,
  s.start_time || ' - ' || s.end_time as time_range,
  s.specialization,
  l.name as location,
  d.name as department
FROM public.shifts s
LEFT JOIN public.users u ON s.user_id = u.id
LEFT JOIN public.locations l ON s.location_id = l.id
LEFT JOIN public.departments d ON s.department_id = d.id
ORDER BY s.date, s.start_time
LIMIT 10;
