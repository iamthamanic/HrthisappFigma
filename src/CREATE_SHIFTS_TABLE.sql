-- ============================================
-- SHIFTS TABLE FOR SCHICHTPLANUNG
-- ============================================
-- Version: 1.0.0
-- Purpose: Shift scheduling for BrowoKoordinator-Kalender
-- ============================================

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
    RAISE NOTICE '✅ Shifts table created successfully!';
  ELSE
    RAISE EXCEPTION '❌ Failed to create shifts table!';
  END IF;
END $$;

-- Display summary
DO $$
DECLARE
  row_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO row_count FROM public.shifts;
  
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ SHIFTS TABLE SETUP COMPLETE!';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Table: public.shifts';
  RAISE NOTICE 'Current rows: %', row_count;
  RAISE NOTICE 'Indexes: ✅ date, user_id, team_id, created_by';
  RAISE NOTICE 'RLS: ✅ Enabled with 4 policies';
  RAISE NOTICE 'Trigger: ✅ updated_at auto-update';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Run v4.12.0_SCHICHTPLANUNG_MIGRATION.sql';
  RAISE NOTICE '================================================';
END $$;
