-- ============================================
-- v4.6.0 - Extended User Fields Migration
-- ============================================
-- Adds: Geburtsdatum, Geschlecht, Land, Bundesland, 
--       Vertragsstatus, Befristet bis, Wiedereintrittsdatum

-- Add new columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'diverse')),
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS contract_status TEXT CHECK (contract_status IN ('unlimited', 'fixed_term')),
  ADD COLUMN IF NOT EXISTS contract_end_date DATE,
  ADD COLUMN IF NOT EXISTS re_entry_dates JSONB DEFAULT '[]'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN users.birth_date IS 'Geburtsdatum des Mitarbeiters';
COMMENT ON COLUMN users.gender IS 'Geschlecht: male (männlich), female (weiblich), diverse (divers)';
COMMENT ON COLUMN users.country IS 'Land in der Adresse';
COMMENT ON COLUMN users.state IS 'Bundesland in der Adresse';
COMMENT ON COLUMN users.contract_status IS 'Vertragsstatus: unlimited (unbefristet), fixed_term (befristet)';
COMMENT ON COLUMN users.contract_end_date IS 'Befristet bis Datum (nur wenn contract_status = fixed_term)';
COMMENT ON COLUMN users.re_entry_dates IS 'Array von Wiedereintrittsdaten (JSONB Array von ISO date strings)';

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_birth_date ON users(birth_date);
CREATE INDEX IF NOT EXISTS idx_users_contract_end_date ON users(contract_end_date);

-- Function to calculate age from birth_date
CREATE OR REPLACE FUNCTION calculate_age(birth_date DATE)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF birth_date IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN EXTRACT(YEAR FROM AGE(birth_date));
END;
$$;

COMMENT ON FUNCTION calculate_age IS 'Berechnet das Alter aus dem Geburtsdatum';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 056 completed successfully!';
  RAISE NOTICE '📋 Added columns: birth_date, gender, country, state, contract_status, contract_end_date, re_entry_dates';
  RAISE NOTICE '🎂 Added function: calculate_age(birth_date)';
  RAISE NOTICE '🔍 Added indexes for performance';
END $$;
