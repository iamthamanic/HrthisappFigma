-- =====================================================
-- ORGANIGRAM SYSTEM MIGRATION
-- =====================================================
-- This migration adds the organigram (org chart) system
-- with positions, specializations, and employee assignments
-- =====================================================

-- 1. Create organigram_positions table
CREATE TABLE IF NOT EXISTS organigram_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  specialization VARCHAR(255),
  primary_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  backup_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_organigram_positions_department ON organigram_positions(department_id);
CREATE INDEX IF NOT EXISTS idx_organigram_positions_organization ON organigram_positions(organization_id);

-- 3. Add columns to departments if they don't exist
ALTER TABLE departments 
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 4. Update existing departments with default sort_order if needed
UPDATE departments SET sort_order = 0 WHERE sort_order IS NULL;

-- 5. Comments
COMMENT ON TABLE organigram_positions IS 'Positions in the organizational chart with primary and backup employees';
COMMENT ON COLUMN organigram_positions.specialization IS 'Optional specialization for the position';
COMMENT ON COLUMN organigram_positions.primary_user_id IS 'Primary employee assigned to this position';
COMMENT ON COLUMN organigram_positions.backup_user_id IS 'Backup/substitute employee for this position';
COMMENT ON COLUMN departments.location_id IS 'Location/Standort assigned to this department';
COMMENT ON COLUMN departments.sort_order IS 'Order for displaying departments in organigram';

-- 6. Function to auto-set organization_id from department
CREATE OR REPLACE FUNCTION set_position_organization_id()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $function$
BEGIN
  SELECT organization_id INTO NEW.organization_id
  FROM departments
  WHERE id = NEW.department_id;
  
  RETURN NEW;
END;
$function$;

-- 7. Trigger to auto-set organization_id
DROP TRIGGER IF EXISTS trigger_set_position_organization_id ON organigram_positions;
CREATE TRIGGER trigger_set_position_organization_id
  BEFORE INSERT ON organigram_positions
  FOR EACH ROW
  EXECUTE FUNCTION set_position_organization_id();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- The organigram system is now ready to use!
-- Navigate to /admin/organigram to start creating positions.
-- =====================================================
