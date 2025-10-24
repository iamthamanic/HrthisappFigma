-- ============================================
-- v4.8.0 - FIX MISSING USER COLUMNS
-- ============================================
-- This fixes the "gender" column error and ensures all required columns exist

-- Check current state
DO $$
BEGIN
  RAISE NOTICE '🔍 Checking which columns are missing...';
END $$;

-- Add ALL missing columns (safe with IF NOT EXISTS)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'diverse', 'prefer_not_to_say')),
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS contract_status TEXT CHECK (contract_status IN ('unlimited', 'fixed_term')),
  ADD COLUMN IF NOT EXISTS contract_end_date DATE,
  ADD COLUMN IF NOT EXISTS re_entry_dates JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS probation_period_months INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS work_phone TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS emergency_contacts JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS language_skills JSONB DEFAULT '[]'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN users.birth_date IS 'Geburtsdatum des Mitarbeiters';
COMMENT ON COLUMN users.gender IS 'Geschlecht: male, female, diverse, prefer_not_to_say';
COMMENT ON COLUMN users.country IS 'Land in der Adresse';
COMMENT ON COLUMN users.state IS 'Bundesland in der Adresse';
COMMENT ON COLUMN users.contract_status IS 'Vertragsstatus: unlimited, fixed_term';
COMMENT ON COLUMN users.contract_end_date IS 'Befristet bis Datum';
COMMENT ON COLUMN users.re_entry_dates IS 'Array von Wiedereintrittsdaten';
COMMENT ON COLUMN users.probation_period_months IS 'Probezeit in Monaten';
COMMENT ON COLUMN users.work_phone IS 'Firmentelefon';
COMMENT ON COLUMN users.emergency_contacts IS 'Notfallkontakte (JSONB Array)';
COMMENT ON COLUMN users.language_skills IS 'Sprachkenntnisse (JSONB Array)';

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_users_birth_date ON users(birth_date);
CREATE INDEX IF NOT EXISTS idx_users_contract_end_date ON users(contract_end_date);
CREATE INDEX IF NOT EXISTS idx_users_probation_period ON users(probation_period_months) WHERE probation_period_months IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_work_phone ON users(work_phone) WHERE work_phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_emergency_contacts ON users USING GIN (emergency_contacts);
CREATE INDEX IF NOT EXISTS idx_users_language_skills ON users USING GIN (language_skills);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ All user columns have been added successfully!';
  RAISE NOTICE '📋 Columns: birth_date, gender, country, state, contract_status, contract_end_date, re_entry_dates';
  RAISE NOTICE '📋 Columns: probation_period_months, work_phone, emergency_contacts, language_skills';
  RAISE NOTICE '🔍 Indexes created for better performance';
  RAISE NOTICE '';
  RAISE NOTICE '👉 You can now use PersonalSettings.tsx without errors!';
END $$;
