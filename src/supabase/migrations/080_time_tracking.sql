-- ============================================
-- BROWO KOORDINATOR - TIME TRACKING MIGRATION
-- ============================================
-- Version: 1.0.0
-- Date: 2024-12-18
-- Migration: 080
-- Description: Erstellt time_records_f659121d für Factorial-Style Time Tracking
-- ============================================

-- ==========================================
-- 1. CREATE time_records table
-- ==========================================

CREATE TABLE IF NOT EXISTS time_records_f659121d (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Date and time fields
  date DATE NOT NULL,
  time_in TIME NOT NULL,
  time_out TIME,
  
  -- Work details
  work_type TEXT NOT NULL CHECK (work_type IN ('office', 'field', 'extern')) DEFAULT 'office',
  status TEXT NOT NULL CHECK (status IN ('running', 'completed')) DEFAULT 'completed',
  
  -- Break and hours calculation
  break_minutes INTEGER DEFAULT 0,
  total_hours DECIMAL(5,2),
  
  -- Optional location reference (no FK constraint - locations may not exist)
  location_id UUID,
  
  -- Optional notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, date, time_in)
);

-- ==========================================
-- 2. Create indexes for performance
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_time_records_user_date 
ON time_records_f659121d(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_time_records_status 
ON time_records_f659121d(user_id, date, status);

CREATE INDEX IF NOT EXISTS idx_time_records_work_type 
ON time_records_f659121d(work_type);

CREATE INDEX IF NOT EXISTS idx_time_records_date 
ON time_records_f659121d(date DESC);

CREATE INDEX IF NOT EXISTS idx_time_records_location 
ON time_records_f659121d(location_id) WHERE location_id IS NOT NULL;

-- ==========================================
-- 3. Create trigger for updated_at
-- ==========================================

CREATE OR REPLACE FUNCTION update_time_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS time_records_updated_at_trigger ON time_records_f659121d;

CREATE TRIGGER time_records_updated_at_trigger
BEFORE UPDATE ON time_records_f659121d
FOR EACH ROW
EXECUTE FUNCTION update_time_records_updated_at();

-- ==========================================
-- 4. Row Level Security (RLS) Policies
-- ==========================================

-- Enable RLS
ALTER TABLE time_records_f659121d ENABLE ROW LEVEL SECURITY;

-- Users can read their own records
CREATE POLICY "Users can view own time records"
ON time_records_f659121d
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own records
CREATE POLICY "Users can create own time records"
ON time_records_f659121d
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own records
CREATE POLICY "Users can update own time records"
ON time_records_f659121d
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own records (optional - only for correction)
CREATE POLICY "Users can delete own time records"
ON time_records_f659121d
FOR DELETE
USING (auth.uid() = user_id);

-- Admins/HR can view all records
CREATE POLICY "Admins can view all time records"
ON time_records_f659121d
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('superadmin', 'hr', 'teamlead')
  )
);

-- Admins/HR can update all records
CREATE POLICY "Admins can update all time records"
ON time_records_f659121d
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('superadmin', 'hr')
  )
);

-- ==========================================
-- 5. Add helpful comments
-- ==========================================

COMMENT ON TABLE time_records_f659121d IS 'Factorial-style time tracking records for office/field/extern work';
COMMENT ON COLUMN time_records_f659121d.work_type IS 'Type of work: office, field, or extern';
COMMENT ON COLUMN time_records_f659121d.status IS 'Record status: running (currently clocked in) or completed';
COMMENT ON COLUMN time_records_f659121d.break_minutes IS 'Break duration in minutes (auto-calculated or manual)';
COMMENT ON COLUMN time_records_f659121d.total_hours IS 'Total work hours minus breaks';

-- ==========================================
-- ✅ MIGRATION 080 COMPLETE
-- ==========================================
-- 
-- What was created:
-- - time_records_f659121d table with all required columns
-- - 5 indexes for performance
-- - updated_at trigger
-- - 7 RLS policies (users can CRUD own records, admins can view/update all)
--
-- Next steps:
-- 1. Deploy Edge Function: BrowoKoordinator-Zeiterfassung (already updated)
-- 2. Test clock-in/clock-out in frontend
-- 3. Verify RLS policies work correctly
-- ==========================================