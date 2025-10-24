-- =====================================================
-- DEPARTMENTS ORGANIGRAM HIERARCHY MIGRATION
-- =====================================================
-- This migration extends the departments table to support:
-- 1. Department hierarchy (parent-child relationships)
-- 2. Drag & Drop positioning (x, y coordinates)
-- 3. Location vs Department distinction
-- 4. Primary and Backup users per department
-- =====================================================

-- Add new columns to departments table
ALTER TABLE departments
ADD COLUMN IF NOT EXISTS parent_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS x_position FLOAT,
ADD COLUMN IF NOT EXISTS y_position FLOAT,
ADD COLUMN IF NOT EXISTS is_location BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS primary_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS backup_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_departments_parent_id ON departments(parent_department_id);
CREATE INDEX IF NOT EXISTS idx_departments_primary_user ON departments(primary_user_id);
CREATE INDEX IF NOT EXISTS idx_departments_backup_user ON departments(backup_user_id);
CREATE INDEX IF NOT EXISTS idx_departments_is_location ON departments(is_location);

-- Add comments for documentation
COMMENT ON COLUMN departments.parent_department_id IS 'Parent department in the hierarchy (NULL for root departments like Geschäftsführung)';
COMMENT ON COLUMN departments.x_position IS 'X coordinate for drag & drop positioning in organigram';
COMMENT ON COLUMN departments.y_position IS 'Y coordinate for drag & drop positioning in organigram';
COMMENT ON COLUMN departments.is_location IS 'TRUE if this is a location node (e.g., Berlin, München), FALSE for regular departments';
COMMENT ON COLUMN departments.primary_user_id IS 'Primary responsible user for this department';
COMMENT ON COLUMN departments.backup_user_id IS 'Backup/secondary responsible user for this department';

-- =====================================================
-- DEFAULT ORGANIGRAM TEMPLATE
-- =====================================================
-- Create a default hierarchical structure for new organizations
-- This will be automatically created when the first user signs up
-- =====================================================

-- Note: The default structure is created by the auto_assign_default_org trigger
-- This migration just adds the necessary columns to support it

-- Example structure that can be created:
-- Geschäftsführung (root, x: 500, y: 50)
--   ├─ Standort Berlin (location, x: 300, y: 250)
--   │   ├─ HR (x: 200, y: 450)
--   │   └─ Buchhaltung (x: 400, y: 450)
--   └─ Standort München (location, x: 700, y: 250)
--       ├─ IT (x: 600, y: 450)
--       └─ Marketing (x: 800, y: 450)

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN
  RAISE NOTICE '✅ Departments Organigram Hierarchy Migration completed successfully!';
  RAISE NOTICE '📊 New columns added: parent_department_id, x_position, y_position, is_location, primary_user_id, backup_user_id';
  RAISE NOTICE '🎯 Indexes created for optimal performance';
  RAISE NOTICE '🌳 Ready for hierarchical department structures with drag & drop positioning';
END $$;
