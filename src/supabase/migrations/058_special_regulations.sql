/**
 * Migration 058: Special Regulations
 * Version: v4.7.1
 * 
 * Adds special_regulations JSONB field for tracking employee special regulations
 * (company car, travel expenses, extra vacation, etc.)
 */

-- Add special_regulations column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS special_regulations JSONB DEFAULT '[]'::jsonb;

-- Add index for special_regulations
CREATE INDEX IF NOT EXISTS idx_users_special_regulations 
ON users USING GIN (special_regulations);

-- Add comment
COMMENT ON COLUMN users.special_regulations IS 
'Array of special regulations for employee. Each regulation has: type (company_car, travel_expenses, vacation, other), custom_description (for type=other), notes.';

-- Validation message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 058 completed successfully!';
  RAISE NOTICE '   - Added special_regulations (JSONB Array)';
  RAISE NOTICE '   - Added GIN index for fast queries';
END $$;
