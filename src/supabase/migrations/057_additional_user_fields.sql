/**
 * Migration 057: Additional User Fields
 * Version: v4.7.0
 * 
 * NEW FIELDS:
 * - Probation Period & Calculation
 * - Work Phone
 * - Emergency Contacts (Array)
 * - Language Skills (Array)
 */

-- =============================================
-- 1. ADD NEW COLUMNS TO USERS TABLE
-- =============================================

-- Probation Period (in months)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS probation_period_months INTEGER DEFAULT NULL;

-- Work Phone
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS work_phone TEXT DEFAULT NULL;

-- Emergency Contacts (JSONB Array)
-- Structure: [{first_name, last_name, phone, email}, ...]
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS emergency_contacts JSONB DEFAULT '[]'::jsonb;

-- Language Skills (JSONB Array)
-- Structure: [{language, level}, ...]
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS language_skills JSONB DEFAULT '[]'::jsonb;

-- =============================================
-- 2. ADD INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_users_probation_period 
ON users(probation_period_months) 
WHERE probation_period_months IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_work_phone 
ON users(work_phone) 
WHERE work_phone IS NOT NULL;

-- GIN indexes for JSONB array searches
CREATE INDEX IF NOT EXISTS idx_users_emergency_contacts 
ON users USING GIN (emergency_contacts);

CREATE INDEX IF NOT EXISTS idx_users_language_skills 
ON users USING GIN (language_skills);

-- =============================================
-- 3. CREATE PROBATION END DATE CALCULATION FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION calculate_probation_end_date(
  p_start_date DATE,
  p_probation_months INTEGER
)
RETURNS DATE
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- If no start date or probation period, return NULL
  IF p_start_date IS NULL OR p_probation_months IS NULL THEN
    RETURN NULL;
  END IF;

  -- Calculate end date: start_date + probation_months
  RETURN p_start_date + (p_probation_months || ' months')::INTERVAL;
END;
$$;

-- =============================================
-- 4. CREATE CONTRACT DAYS REMAINING FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION calculate_contract_days_remaining(
  p_contract_end_date DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- If no end date, return NULL
  IF p_contract_end_date IS NULL THEN
    RETURN NULL;
  END IF;

  -- Calculate days remaining from today
  RETURN EXTRACT(DAY FROM (p_contract_end_date - CURRENT_DATE));
END;
$$;

-- =============================================
-- 5. ADD COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON COLUMN users.probation_period_months IS 
'Probation period duration in months. Used with start_date to calculate probation end date.';

COMMENT ON COLUMN users.work_phone IS 
'Company/work phone number (separate from private phone).';

COMMENT ON COLUMN users.emergency_contacts IS 
'Array of emergency contacts. Each contact has: first_name, last_name, phone, email.';

COMMENT ON COLUMN users.language_skills IS 
'Array of language skills. Each skill has: language (string), level (A1, A2, B1, B2, C1, C2, native).';

COMMENT ON FUNCTION calculate_probation_end_date IS 
'Calculates probation end date by adding probation_period_months to start_date.';

COMMENT ON FUNCTION calculate_contract_days_remaining IS 
'Calculates number of days remaining until contract end date.';

-- =============================================
-- 6. VALIDATION: Check if migration was successful
-- =============================================

DO $$
BEGIN
  -- Check if all columns exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name IN ('probation_period_months', 'work_phone', 'emergency_contacts', 'language_skills')
    HAVING COUNT(*) = 4
  ) THEN
    RAISE EXCEPTION '❌ Migration 057 failed: Not all columns were created';
  END IF;

  RAISE NOTICE '✅ Migration 057 completed successfully!';
  RAISE NOTICE '   - Added probation_period_months';
  RAISE NOTICE '   - Added work_phone';
  RAISE NOTICE '   - Added emergency_contacts (JSONB)';
  RAISE NOTICE '   - Added language_skills (JSONB)';
  RAISE NOTICE '   - Created calculate_probation_end_date() function';
  RAISE NOTICE '   - Created calculate_contract_days_remaining() function';
END $$;
