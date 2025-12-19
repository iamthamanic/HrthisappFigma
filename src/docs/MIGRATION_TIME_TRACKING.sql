-- ============================================
-- BROWO KOORDINATOR - TIME TRACKING MIGRATION
-- ============================================
-- Version: 1.0.0
-- Date: 2024-12-18
-- Description: Erweitert time_records_f659121d für Factorial-Style Time Tracking
-- ============================================

-- ==========================================
-- 1. Add new columns to time_records table
-- ==========================================

ALTER TABLE time_records_f659121d
ADD COLUMN IF NOT EXISTS work_type TEXT CHECK (work_type IN ('office', 'field', 'extern')) DEFAULT 'office',
ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('running', 'completed')) DEFAULT 'completed',
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations_f659121d(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ==========================================
-- 2. Create indexes for performance
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_time_records_status 
ON time_records_f659121d(user_id, date, status);

CREATE INDEX IF NOT EXISTS idx_time_records_work_type 
ON time_records_f659121d(work_type);

CREATE INDEX IF NOT EXISTS idx_time_records_date 
ON time_records_f659121d(date DESC);

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
-- 4. Migrate existing data (if any)
-- ==========================================

-- Set default work_type and status for existing records
UPDATE time_records_f659121d
SET 
  work_type = COALESCE(work_type, 'office'),
  status = CASE 
    WHEN time_out IS NULL AND status IS NULL THEN 'running'
    WHEN status IS NULL THEN 'completed'
    ELSE status
  END,
  updated_at = COALESCE(updated_at, created_at, NOW())
WHERE work_type IS NULL OR status IS NULL OR updated_at IS NULL;

-- ==========================================
-- 5. Row Level Security (RLS) Policies
-- ==========================================

-- Enable RLS if not already enabled
ALTER TABLE time_records_f659121d ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own time records" ON time_records_f659121d;
DROP POLICY IF EXISTS "Users can create own time records" ON time_records_f659121d;
DROP POLICY IF EXISTS "Users can update own time records" ON time_records_f659121d;
DROP POLICY IF EXISTS "Admins can view all time records" ON time_records_f659121d;

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

-- Admins can view all records
CREATE POLICY "Admins can view all time records"
ON time_records_f659121d
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles_f659121d
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'hr')
  )
);

-- ==========================================
-- 6. Verification queries
-- ==========================================

-- Check if columns were added
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'time_records_f659121d'
AND column_name IN ('work_type', 'status', 'location_id', 'updated_at');

-- Check indexes
SELECT 
  indexname, 
  indexdef
FROM pg_indexes 
WHERE tablename = 'time_records_f659121d'
AND indexname LIKE '%status%' OR indexname LIKE '%work_type%';

-- Check trigger
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'time_records_f659121d';

-- ==========================================
-- ✅ MIGRATION COMPLETE
-- ==========================================

-- Test query: Get all time records with new columns
SELECT 
  id,
  user_id,
  date,
  time_in,
  time_out,
  work_type,
  status,
  total_hours,
  break_minutes,
  created_at,
  updated_at
FROM time_records_f659121d
ORDER BY date DESC, time_in DESC
LIMIT 5;

-- Summary statistics
SELECT 
  work_type,
  status,
  COUNT(*) as count,
  SUM(total_hours) as total_hours
FROM time_records_f659121d
GROUP BY work_type, status
ORDER BY work_type, status;
