-- =====================================================
-- Migration 064: Positions Management System
-- =====================================================
-- Erstellt: 2025-12-11
-- Beschreibung: 
--   - Positions-Verwaltung mit Factorial-Features
--   - Many-to-Many zu Departments & Locations
--   - Gehaltsbänder, Anforderungen, Hierarchie
--   - Automatische Migration von Freitext-Positionen
-- =====================================================

-- =====================================================
-- 1. POSITIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Basis-Informationen
  name TEXT NOT NULL,
  description TEXT, -- Rich-Text (HTML from Tiptap)
  level TEXT CHECK (level IN ('JUNIOR', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE')),
  
  -- Verantwortlichkeiten
  responsibilities TEXT, -- Rich-Text (HTML from Tiptap)
  
  -- Anforderungen (Strukturiert als JSONB)
  requirements JSONB DEFAULT '{
    "skills": [],
    "experience": null,
    "education": null,
    "certifications": []
  }'::jsonb,
  -- Struktur:
  -- {
  --   "skills": ["React", "TypeScript", "Node.js"],
  --   "experience": "2-5", // "0-2", "2-5", "5+"
  --   "education": "Bachelor", // "None", "Bachelor", "Master", "PhD"
  --   "certifications": ["PMP", "Scrum Master"]
  -- }
  
  -- Gehaltsbänder
  salary_min NUMERIC,
  salary_max NUMERIC,
  salary_currency TEXT DEFAULT 'EUR' CHECK (salary_currency IN ('EUR', 'USD', 'GBP', 'CHF')),
  salary_period TEXT DEFAULT 'yearly' CHECK (salary_period IN ('yearly', 'monthly')),
  
  -- Hierarchie
  reports_to_position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
  
  -- Recruiting
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'RECRUITING')),
  open_positions INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT positions_organization_name_unique UNIQUE (organization_id, name),
  CONSTRAINT salary_range_valid CHECK (
    (salary_min IS NULL AND salary_max IS NULL) OR 
    (salary_min IS NOT NULL AND salary_max IS NOT NULL AND salary_max >= salary_min)
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_positions_organization ON positions(organization_id);
CREATE INDEX IF NOT EXISTS idx_positions_level ON positions(level);
CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status);
CREATE INDEX IF NOT EXISTS idx_positions_reports_to ON positions(reports_to_position_id);

-- Updated_at Trigger
CREATE OR REPLACE FUNCTION update_positions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_positions_updated_at
  BEFORE UPDATE ON positions
  FOR EACH ROW
  EXECUTE FUNCTION update_positions_updated_at();

-- =====================================================
-- 2. POSITION_DEPARTMENTS (Many-to-Many)
-- =====================================================

CREATE TABLE IF NOT EXISTS position_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT position_departments_unique UNIQUE (position_id, department_id)
);

CREATE INDEX IF NOT EXISTS idx_position_departments_position ON position_departments(position_id);
CREATE INDEX IF NOT EXISTS idx_position_departments_department ON position_departments(department_id);

-- =====================================================
-- 3. POSITION_LOCATIONS (Many-to-Many)
-- =====================================================

CREATE TABLE IF NOT EXISTS position_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT position_locations_unique UNIQUE (position_id, location_id)
);

CREATE INDEX IF NOT EXISTS idx_position_locations_position ON position_locations(position_id);
CREATE INDEX IF NOT EXISTS idx_position_locations_location ON position_locations(location_id);

-- =====================================================
-- 4. ADD position_id TO USERS TABLE
-- =====================================================

-- Add column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'position_id'
  ) THEN
    ALTER TABLE users ADD COLUMN position_id UUID REFERENCES positions(id) ON DELETE SET NULL;
    CREATE INDEX idx_users_position ON users(position_id);
  END IF;
END $$;

-- Note: users.position (TEXT) bleibt als deprecated/backup

-- =====================================================
-- 5. RLS POLICIES
-- =====================================================

ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_locations ENABLE ROW LEVEL SECURITY;

-- Positions Policies
DROP POLICY IF EXISTS "Users can view positions in their organization" ON positions;
CREATE POLICY "Users can view positions in their organization"
  ON positions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can insert positions" ON positions;
CREATE POLICY "Admins can insert positions"
  ON positions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND organization_id = positions.organization_id
      AND role IN ('ADMIN', 'HR', 'SUPERADMIN')
    )
  );

DROP POLICY IF EXISTS "Admins can update positions" ON positions;
CREATE POLICY "Admins can update positions"
  ON positions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND organization_id = positions.organization_id
      AND role IN ('ADMIN', 'HR', 'SUPERADMIN')
    )
  );

DROP POLICY IF EXISTS "Admins can delete positions" ON positions;
CREATE POLICY "Admins can delete positions"
  ON positions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND organization_id = positions.organization_id
      AND role IN ('ADMIN', 'HR', 'SUPERADMIN')
    )
  );

-- Position_Departments Policies
DROP POLICY IF EXISTS "Users can view position_departments" ON position_departments;
CREATE POLICY "Users can view position_departments"
  ON position_departments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM positions p
      WHERE p.id = position_departments.position_id
      AND p.organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Admins can manage position_departments" ON position_departments;
CREATE POLICY "Admins can manage position_departments"
  ON position_departments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM positions p
      JOIN users u ON u.organization_id = p.organization_id
      WHERE p.id = position_departments.position_id
      AND u.id = auth.uid()
      AND u.role IN ('ADMIN', 'HR', 'SUPERADMIN')
    )
  );

-- Position_Locations Policies
DROP POLICY IF EXISTS "Users can view position_locations" ON position_locations;
CREATE POLICY "Users can view position_locations"
  ON position_locations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM positions p
      WHERE p.id = position_locations.position_id
      AND p.organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Admins can manage position_locations" ON position_locations;
CREATE POLICY "Admins can manage position_locations"
  ON position_locations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM positions p
      JOIN users u ON u.organization_id = p.organization_id
      WHERE p.id = position_locations.position_id
      AND u.id = auth.uid()
      AND u.role IN ('ADMIN', 'HR', 'SUPERADMIN')
    )
  );

-- =====================================================
-- 6. AUTOMATIC MIGRATION: Freitext → positions
-- =====================================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Count unique positions to migrate
  SELECT COUNT(DISTINCT position) INTO v_count
  FROM users
  WHERE position IS NOT NULL 
  AND position != ''
  AND position_id IS NULL;
  
  RAISE NOTICE 'Migrating % unique positions from users.position to positions table...', v_count;
  
  -- Insert unique positions
  INSERT INTO positions (organization_id, name, level, description, status)
  SELECT DISTINCT 
    u.organization_id,
    u.position AS name,
    'MID' AS level, -- Default level
    'Automatisch migriert aus Freitext-Position' AS description,
    'ACTIVE' AS status
  FROM users u
  WHERE u.position IS NOT NULL 
  AND u.position != ''
  AND NOT EXISTS (
    SELECT 1 FROM positions p 
    WHERE p.organization_id = u.organization_id 
    AND p.name = u.position
  )
  ON CONFLICT (organization_id, name) DO NOTHING;
  
  RAISE NOTICE 'Positions created. Now linking users to positions...';
  
  -- Update users.position_id
  UPDATE users u
  SET position_id = (
    SELECT p.id 
    FROM positions p 
    WHERE p.name = u.position 
    AND p.organization_id = u.organization_id
    LIMIT 1
  )
  WHERE u.position IS NOT NULL 
  AND u.position != ''
  AND u.position_id IS NULL;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Linked % users to positions', v_count;
  
  RAISE NOTICE '✅ Migration complete! users.position (TEXT) is now deprecated.';
  RAISE NOTICE '⚠️  HR must manually assign departments to migrated positions!';
END $$;

-- =====================================================
-- 7. HELPER FUNCTIONS
-- =====================================================

-- Function: Get employee count for a position
CREATE OR REPLACE FUNCTION get_position_employee_count(position_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM users
    WHERE position_id = position_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get departments for a position (as array)
CREATE OR REPLACE FUNCTION get_position_departments(position_uuid UUID)
RETURNS TEXT[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT d.name
    FROM departments d
    JOIN position_departments pd ON pd.department_id = d.id
    WHERE pd.position_id = position_uuid
    ORDER BY d.name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get locations for a position (as array)
CREATE OR REPLACE FUNCTION get_position_locations(position_uuid UUID)
RETURNS TEXT[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT l.name
    FROM locations l
    JOIN position_locations pl ON pl.location_id = l.id
    WHERE pl.position_id = position_uuid
    ORDER BY l.name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. VERIFICATION
-- =====================================================

-- Check tables
SELECT 
  'positions' AS table_name,
  COUNT(*) AS row_count
FROM positions
UNION ALL
SELECT 
  'position_departments',
  COUNT(*)
FROM position_departments
UNION ALL
SELECT 
  'position_locations',
  COUNT(*)
FROM position_locations
UNION ALL
SELECT 
  'users with position_id',
  COUNT(*)
FROM users
WHERE position_id IS NOT NULL;

-- =====================================================
-- DONE! 🎉
-- =====================================================
-- Next Steps:
-- 1. Deploy this migration
-- 2. Create positionsStore
-- 3. Create PositionsTab component
-- 4. Update AddEmployeeScreen with position dropdown
-- 5. HR must manually assign departments to migrated positions
-- =====================================================
